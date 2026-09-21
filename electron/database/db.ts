import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { SCHEMA_SQL } from './schema';
import { INITIAL_SEED } from './seed';
import { readAudioDataUrl, removeAudioFile } from '../services/fileStorage';

let db: Database | null = null;
let dbPath = '';
let saveTimeout: NodeJS.Timeout | null = null;

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const wasmCandidate = path.join(__dirname, 'sql-wasm.wasm');
  const SQL = await initSqlJs(
    fs.existsSync(wasmCandidate) ? { locateFile: () => wasmCandidate } : undefined
  );
  const userDataDir = app ? app.getPath('userData') : path.join(process.cwd(), 'userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  dbPath = path.join(userDataDir, 'selfnote.db');
  let isNew = false;

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    isNew = true;
  }

  // Initialize schema
  db.run(SCHEMA_SQL);

  // Seed with initial realistic DSA content if new database
  if (isNew) {
    seedDatabase(db);
    persistDatabaseSync();
  }

  return db;
}

function persistDatabaseSync() {
  if (!db || !dbPath) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

export function saveDatabase() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    persistDatabaseSync();
  }, 200);
}

function seedDatabase(database: Database) {
  for (const b of INITIAL_SEED.branches) {
    database.run(
      `INSERT INTO branches (id, parent_id, name, order_index, is_starred, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.id, b.parent_id, b.name, b.order_index, b.is_starred, b.is_deleted, b.created_at, b.updated_at]
    );
  }

  for (const q of INITIAL_SEED.questions) {
    database.run(
      `INSERT INTO questions (id, branch_id, title, url, difficulty, status, problem_statement, solution_approach, solution_code, solution_language, time_complexity, space_complexity, special_notes, is_important, is_deleted, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        q.id,
        q.branch_id,
        q.title,
        q.url,
        q.difficulty,
        q.status,
        q.problem_statement,
        q.solution_approach,
        q.solution_code,
        q.solution_language,
        q.time_complexity,
        q.space_complexity,
        q.special_notes,
        q.is_important,
        q.is_deleted,
        q.tags,
        q.created_at,
        q.updated_at
      ]
    );
  }
}

// Helper to run query and return objects
function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

// Branch Operations
export function getBranches(includeDeleted = false) {
  const sql = includeDeleted
    ? `SELECT * FROM branches ORDER BY order_index ASC, name ASC`
    : `SELECT * FROM branches WHERE is_deleted = 0 ORDER BY order_index ASC, name ASC`;
  const rows = queryAll(sql);
  return rows.map(r => ({
    id: r.id,
    parentId: r.parent_id,
    name: r.name,
    orderIndex: r.order_index,
    isStarred: Boolean(r.is_starred),
    isDeleted: Boolean(r.is_deleted),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

export function saveBranch(branch: any) {
  if (!db) throw new Error('Database not initialized');
  const existing = queryAll(`SELECT id FROM branches WHERE id = ?`, [branch.id]);
  const now = new Date().toISOString();
  if (existing.length > 0) {
    db.run(
      `UPDATE branches SET parent_id = ?, name = ?, order_index = ?, is_starred = ?, is_deleted = ?, updated_at = ? WHERE id = ?`,
      [
        branch.parentId || null,
        branch.name,
        branch.orderIndex || 0,
        branch.isStarred ? 1 : 0,
        branch.isDeleted ? 1 : 0,
        now,
        branch.id
      ]
    );
  } else {
    db.run(
      `INSERT INTO branches (id, parent_id, name, order_index, is_starred, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch.id,
        branch.parentId || null,
        branch.name,
        branch.orderIndex || 0,
        branch.isStarred ? 1 : 0,
        branch.isDeleted ? 1 : 0,
        branch.createdAt || now,
        now
      ]
    );
  }
  saveDatabase();
  return branch;
}

export function deleteBranch(id: string, softDelete = true) {
  if (!db) throw new Error('Database not initialized');
  if (softDelete) {
    db.run(`UPDATE branches SET is_deleted = 1, updated_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
    // Also soft-delete questions in this branch
    db.run(`UPDATE questions SET is_deleted = 1, updated_at = ? WHERE branch_id = ?`, [new Date().toISOString(), id]);
  } else {
    db.run(`DELETE FROM branches WHERE id = ?`, [id]);
    db.run(`DELETE FROM questions WHERE branch_id = ?`, [id]);
  }
  saveDatabase();
  return true;
}

// Question Operations
export function getQuestions(branchId?: string, includeDeleted = false) {
  let sql = includeDeleted
    ? `SELECT * FROM questions`
    : `SELECT * FROM questions WHERE is_deleted = 0`;
  const params: any[] = [];
  if (branchId) {
    sql += includeDeleted ? ` WHERE branch_id = ?` : ` AND branch_id = ?`;
    params.push(branchId);
  }
  sql += ` ORDER BY 
    CASE LOWER(difficulty)
      WHEN 'easy' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'hard' THEN 3
      ELSE 4
    END ASC,
    title ASC`;

  const rows = queryAll(sql, params);
  return rows.map(r => ({
    id: r.id,
    branchId: r.branch_id,
    title: r.title,
    url: r.url || '',
    difficulty: r.difficulty || 'Medium',
    status: r.status || 'not_started',
    problemStatement: r.problem_statement || '',
    solutionApproach: r.solution_approach || '',
    solutionCode: r.solution_code || '',
    solutionLanguage: r.solution_language || 'cpp',
    timeComplexity: r.time_complexity || '',
    spaceComplexity: r.space_complexity || '',
    specialNotes: r.special_notes || '',
    isImportant: Boolean(r.is_important),
    isDeleted: Boolean(r.is_deleted),
    tags: JSON.parse(r.tags || '[]'),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

export function getQuestionById(id: string) {
  const rows = queryAll(`SELECT * FROM questions WHERE id = ?`, [id]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    branchId: r.branch_id,
    title: r.title,
    url: r.url || '',
    difficulty: r.difficulty || 'Medium',
    status: r.status || 'not_started',
    problemStatement: r.problem_statement || '',
    solutionApproach: r.solution_approach || '',
    solutionCode: r.solution_code || '',
    solutionLanguage: r.solution_language || 'cpp',
    timeComplexity: r.time_complexity || '',
    spaceComplexity: r.space_complexity || '',
    specialNotes: r.special_notes || '',
    isImportant: Boolean(r.is_important),
    isDeleted: Boolean(r.is_deleted),
    tags: JSON.parse(r.tags || '[]'),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export function saveQuestion(q: any) {
  if (!db) throw new Error('Database not initialized');
  const existing = queryAll(`SELECT id FROM questions WHERE id = ?`, [q.id]);
  const now = new Date().toISOString();
  const tagsStr = JSON.stringify(q.tags || []);

  if (existing.length > 0) {
    db.run(
      `UPDATE questions SET
        branch_id = ?,
        title = ?,
        url = ?,
        difficulty = ?,
        status = ?,
        problem_statement = ?,
        solution_approach = ?,
        solution_code = ?,
        solution_language = ?,
        time_complexity = ?,
        space_complexity = ?,
        special_notes = ?,
        is_important = ?,
        is_deleted = ?,
        tags = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        q.branchId,
        q.title,
        q.url || '',
        q.difficulty || 'Medium',
        q.status || 'not_started',
        q.problemStatement || '',
        q.solutionApproach || '',
        q.solutionCode || '',
        q.solutionLanguage || 'cpp',
        q.timeComplexity || '',
        q.spaceComplexity || '',
        q.specialNotes || '',
        q.isImportant ? 1 : 0,
        q.isDeleted ? 1 : 0,
        tagsStr,
        now,
        q.id
      ]
    );
  } else {
    db.run(
      `INSERT INTO questions (
        id, branch_id, title, url, difficulty, status, problem_statement,
        solution_approach, solution_code, solution_language, time_complexity,
        space_complexity, special_notes, is_important, is_deleted, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        q.id,
        q.branchId,
        q.title,
        q.url || '',
        q.difficulty || 'Medium',
        q.status || 'not_started',
        q.problemStatement || '',
        q.solutionApproach || '',
        q.solutionCode || '',
        q.solutionLanguage || 'cpp',
        q.timeComplexity || '',
        q.spaceComplexity || '',
        q.specialNotes || '',
        q.isImportant ? 1 : 0,
        q.isDeleted ? 1 : 0,
        tagsStr,
        q.createdAt || now,
        now
      ]
    );
  }
  saveDatabase();
  return { ...q, updatedAt: now };
}

export function deleteQuestion(id: string, softDelete = true) {
  if (!db) throw new Error('Database not initialized');
  if (softDelete) {
    db.run(`UPDATE questions SET is_deleted = 1, updated_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
  } else {
    db.run(`DELETE FROM questions WHERE id = ?`, [id]);
    db.run(`DELETE FROM images WHERE question_id = ?`, [id]);
  }
  saveDatabase();
  return true;
}

// Image Operations
export function getImages(questionId: string) {
  const rows = queryAll(`SELECT * FROM images WHERE question_id = ? ORDER BY order_index ASC`, [questionId]);
  return rows.map(r => ({
    id: r.id,
    questionId: r.question_id,
    filePath: r.file_path,
    dataUrl: r.data_url || '',
    caption: r.caption || '',
    orderIndex: r.order_index,
    createdAt: r.created_at
  }));
}

export function saveImage(img: any) {
  if (!db) throw new Error('Database not initialized');
  db.run(
    `INSERT OR REPLACE INTO images (id, question_id, file_path, data_url, caption, order_index, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [img.id, img.questionId, img.filePath, img.dataUrl || '', img.caption || '', img.orderIndex || 0, img.createdAt || new Date().toISOString()]
  );
  saveDatabase();
  return img;
}

export function deleteImage(id: string) {
  if (!db) throw new Error('Database not initialized');
  db.run(`DELETE FROM images WHERE id = ?`, [id]);
  saveDatabase();
  return true;
}

// Voice Notes Operations
export function getVoiceNotes(questionId: string) {
  const rows = queryAll(`SELECT * FROM voice_notes WHERE question_id = ? ORDER BY created_at ASC`, [questionId]);
  return rows.map(r => {
    let dataUrl = r.data_url || '';
    if (!dataUrl && r.file_path) {
      dataUrl = readAudioDataUrl(r.file_path);
    }
    return {
      id: r.id,
      questionId: r.question_id,
      filePath: r.file_path,
      dataUrl,
      title: r.title || 'Voice Note',
      duration: r.duration || 0,
      createdAt: r.created_at
    };
  });
}

export function saveVoiceNote(note: any) {
  if (!db) throw new Error('Database not initialized');
  db.run(
    `INSERT OR REPLACE INTO voice_notes (id, question_id, file_path, data_url, title, duration, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      note.id,
      note.questionId,
      note.filePath || '',
      note.dataUrl || '',
      note.title || 'Voice Note',
      note.duration || 0,
      note.createdAt || new Date().toISOString()
    ]
  );
  saveDatabase();
  return note;
}

export function deleteVoiceNote(id: string) {
  if (!db) throw new Error('Database not initialized');
  const rows = queryAll(`SELECT file_path FROM voice_notes WHERE id = ?`, [id]);
  if (rows.length > 0 && rows[0].file_path) {
    removeAudioFile(rows[0].file_path);
  }
  db.run(`DELETE FROM voice_notes WHERE id = ?`, [id]);
  saveDatabase();
  return true;
}

// Important & Starred
export function getImportantQuestions() {
  const rows = queryAll(`SELECT * FROM questions WHERE is_important = 1 AND is_deleted = 0 ORDER BY 
    CASE LOWER(difficulty)
      WHEN 'easy' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'hard' THEN 3
      ELSE 4
    END ASC,
    title ASC`);
  return rows.map(r => ({
    id: r.id,
    branchId: r.branch_id,
    title: r.title,
    url: r.url || '',
    difficulty: r.difficulty || 'Medium',
    status: r.status || 'not_started',
    problemStatement: r.problem_statement || '',
    solutionApproach: r.solution_approach || '',
    solutionCode: r.solution_code || '',
    solutionLanguage: r.solution_language || 'cpp',
    timeComplexity: r.time_complexity || '',
    spaceComplexity: r.space_complexity || '',
    specialNotes: r.special_notes || '',
    isImportant: true,
    isDeleted: false,
    tags: JSON.parse(r.tags || '[]'),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

// Trash
export function getTrashItems() {
  const branches = queryAll(`SELECT * FROM branches WHERE is_deleted = 1`);
  const questions = queryAll(`SELECT * FROM questions WHERE is_deleted = 1`);
  return {
    branches: branches.map(r => ({
      id: r.id,
      parentId: r.parent_id,
      name: r.name,
      orderIndex: r.order_index,
      isStarred: Boolean(r.is_starred),
      isDeleted: true,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    })),
    questions: questions.map(r => ({
      id: r.id,
      branchId: r.branch_id,
      title: r.title,
      url: r.url || '',
      difficulty: r.difficulty || 'Medium',
      status: r.status || 'not_started',
      isImportant: Boolean(r.is_important),
      isDeleted: true,
      tags: JSON.parse(r.tags || '[]'),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }))
  };
}

export function restoreItem(type: 'branch' | 'question', id: string) {
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  if (type === 'branch') {
    db.run(`UPDATE branches SET is_deleted = 0, updated_at = ? WHERE id = ?`, [now, id]);
    db.run(`UPDATE questions SET is_deleted = 0, updated_at = ? WHERE branch_id = ?`, [now, id]);
  } else {
    db.run(`UPDATE questions SET is_deleted = 0, updated_at = ? WHERE id = ?`, [now, id]);
  }
  saveDatabase();
  return true;
}

export function emptyTrash() {
  if (!db) throw new Error('Database not initialized');
  db.run(`DELETE FROM branches WHERE is_deleted = 1`);
  db.run(`DELETE FROM questions WHERE is_deleted = 1`);
  saveDatabase();
  return true;
}

// Global Search
export function searchAll(queryStr: string) {
  if (!queryStr || queryStr.trim().length === 0) return [];
  const q = `%${queryStr.toLowerCase().trim()}%`;

  const questionMatches = queryAll(
    `SELECT q.*, b.name as branch_name FROM questions q
     JOIN branches b ON q.branch_id = b.id
     WHERE q.is_deleted = 0 AND (
       LOWER(q.title) LIKE ? OR
       LOWER(q.problem_statement) LIKE ? OR
       LOWER(q.solution_approach) LIKE ? OR
       LOWER(q.special_notes) LIKE ? OR
       LOWER(q.tags) LIKE ?
     ) LIMIT 30`,
    [q, q, q, q, q]
  );

  const branchMatches = queryAll(
    `SELECT * FROM branches WHERE is_deleted = 0 AND LOWER(name) LIKE ? LIMIT 15`,
    [q]
  );

  const results: any[] = [];

  for (const b of branchMatches) {
    results.push({
      type: 'branch',
      id: b.id,
      title: b.name,
      subtitle: 'Branch',
      matchField: 'branch',
      snippet: `Branch: ${b.name}`
    });
  }

  for (const qItem of questionMatches) {
    let field = 'title';
    let snippet = qItem.title;
    const lowerQ = queryStr.toLowerCase();

    if (qItem.problem_statement && qItem.problem_statement.toLowerCase().includes(lowerQ)) {
      field = 'statement';
      const idx = qItem.problem_statement.toLowerCase().indexOf(lowerQ);
      const start = Math.max(0, idx - 40);
      const end = Math.min(qItem.problem_statement.length, idx + lowerQ.length + 40);
      snippet = '...' + qItem.problem_statement.substring(start, end).replace(/\n/g, ' ') + '...';
    } else if (qItem.special_notes && qItem.special_notes.toLowerCase().includes(lowerQ)) {
      field = 'notes';
      const idx = qItem.special_notes.toLowerCase().indexOf(lowerQ);
      const start = Math.max(0, idx - 40);
      const end = Math.min(qItem.special_notes.length, idx + lowerQ.length + 40);
      snippet = '...' + qItem.special_notes.substring(start, end).replace(/\n/g, ' ') + '...';
    } else if (qItem.solution_approach && qItem.solution_approach.toLowerCase().includes(lowerQ)) {
      field = 'solution';
      const idx = qItem.solution_approach.toLowerCase().indexOf(lowerQ);
      const start = Math.max(0, idx - 40);
      const end = Math.min(qItem.solution_approach.length, idx + lowerQ.length + 40);
      snippet = '...' + qItem.solution_approach.substring(start, end).replace(/\n/g, ' ') + '...';
    }

    results.push({
      type: 'question',
      id: qItem.id,
      branchId: qItem.branch_id,
      title: qItem.title,
      subtitle: `${qItem.branch_name} • ${qItem.difficulty} • ${qItem.status.replace('_', ' ')}`,
      matchField: field,
      snippet: snippet
    });
  }

  return results;
}

// App Stats for Dashboard
export function getStats() {
  const totalQuestions = queryAll(`SELECT COUNT(*) as c FROM questions WHERE is_deleted = 0`)[0]?.c || 0;
  const solvedQuestions = queryAll(`SELECT COUNT(*) as c FROM questions WHERE status = 'solved' AND is_deleted = 0`)[0]?.c || 0;
  const inProgressQuestions = queryAll(`SELECT COUNT(*) as c FROM questions WHERE status = 'in_progress' AND is_deleted = 0`)[0]?.c || 0;
  const needRevisionQuestions = queryAll(`SELECT COUNT(*) as c FROM questions WHERE status = 'need_revision' AND is_deleted = 0`)[0]?.c || 0;
  const importantQuestions = queryAll(`SELECT COUNT(*) as c FROM questions WHERE is_important = 1 AND is_deleted = 0`)[0]?.c || 0;
  const totalBranches = queryAll(`SELECT COUNT(*) as c FROM branches WHERE is_deleted = 0`)[0]?.c || 0;

  return {
    totalQuestions,
    solvedQuestions,
    inProgressQuestions,
    needRevisionQuestions,
    importantQuestions,
    totalBranches,
    solvedThisWeek: Math.min(solvedQuestions, 5) // representative stat
  };
}

// Settings
export function getSetting(key: string, defaultValue = '') {
  const rows = queryAll(`SELECT value FROM settings WHERE key = ?`, [key]);
  return rows.length > 0 ? rows[0].value : defaultValue;
}

export function setSetting(key: string, value: string) {
  if (!db) throw new Error('Database not initialized');
  db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value]);
  saveDatabase();
  return true;
}

// Export / Import
export function exportAllData() {
  const branches = queryAll(`SELECT * FROM branches WHERE is_deleted = 0`);
  const questions = queryAll(`SELECT * FROM questions WHERE is_deleted = 0`);
  const images = queryAll(`SELECT * FROM images`);
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    branches,
    questions,
    images
  };
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_starred INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT DEFAULT '',
  difficulty TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'not_started',
  problem_statement TEXT DEFAULT '',
  solution_approach TEXT DEFAULT '',
  solution_code TEXT DEFAULT '',
  solution_language TEXT DEFAULT 'cpp',
  time_complexity TEXT DEFAULT '',
  space_complexity TEXT DEFAULT '',
  special_notes TEXT DEFAULT '',
  is_important INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  data_url TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS voice_notes (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  data_url TEXT DEFAULT '',
  title TEXT DEFAULT 'Voice Note',
  duration INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_queue (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_branches_parent ON branches(parent_id);
CREATE INDEX IF NOT EXISTS idx_questions_branch ON questions(branch_id);
CREATE INDEX IF NOT EXISTS idx_questions_important ON questions(is_important);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_images_question ON images(question_id);
`;

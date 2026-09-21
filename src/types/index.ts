export type QuestionStatus = 'not_started' | 'in_progress' | 'solved' | 'need_revision';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Unknown';

export interface Branch {
  id: string;
  parentId: string | null;
  name: string;
  orderIndex: number;
  isStarred: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed tree structure
  children?: Branch[];
  questionCount?: number;
}

export interface SolutionApproach {
  id: string;
  name: string; // e.g. "Approach 1", "Approach 2: Two Pointer"
  code: string;
  language: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

export interface Question {
  id: string;
  branchId: string;
  title: string;
  url: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  problemStatement: string;
  solutionApproach: string;
  solutionCode: string;
  solutionLanguage: string;
  timeComplexity: string;
  spaceComplexity: string;
  specialNotes: string;
  isImportant: boolean;
  isDeleted: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PhotoNote {
  id: string;
  questionId: string;
  filePath: string;
  dataUrl?: string; // base64 / blob for instant rendering
  caption: string;
  orderIndex: number;
  createdAt: string;
}

export interface VoiceNote {
  id: string;
  questionId: string;
  filePath: string;
  dataUrl?: string;
  title: string;
  duration: number; // in seconds
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface GitHubSettings {
  token: string;
  username: string;
  repo: string;
  branch: string;
  backupFolder: string;
  autoBackup: boolean;
  lastBackupTime: string | null;
  lastBackupStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastBackupError?: string;
}

export interface BackupHistoryItem {
  id: string;
  timestamp: string;
  status: 'success' | 'error';
  summary: string;
  commitHash?: string;
}

export interface ImportedProblem {
  title: string;
  url: string;
  difficulty: Difficulty;
  statement: string;
  examples?: string;
  constraints?: string;
  tags: string[];
}

export interface SearchResult {
  type: 'question' | 'branch';
  id: string;
  branchId?: string;
  title: string;
  subtitle: string;
  matchField: 'title' | 'statement' | 'solution' | 'notes' | 'tags' | 'branch';
  snippet: string;
}

export interface AppStats {
  totalQuestions: number;
  solvedQuestions: number;
  inProgressQuestions: number;
  needRevisionQuestions: number;
  importantQuestions: number;
  totalBranches: number;
  solvedThisWeek: number;
}

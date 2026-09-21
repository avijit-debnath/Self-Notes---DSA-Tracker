import { safeStorage } from 'electron';
import { getSetting, setSetting, getBranches, getQuestions, getImages } from '../database/db';
import fs from 'fs';
import path from 'path';

export interface GitHubConfig {
  token: string;
  username: string;
  repo: string;
  branch: string;
  backupFolder: string;
}

export function getGitHubConfig(): GitHubConfig {
  const encToken = getSetting('github_token_enc', '');
  let token = '';
  if (encToken) {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const buffer = Buffer.from(encToken, 'base64');
        token = safeStorage.decryptString(buffer);
      } else {
        token = Buffer.from(encToken, 'base64').toString('utf8');
      }
    } catch {
      token = '';
    }
  }

  return {
    token,
    username: getSetting('github_username', ''),
    repo: getSetting('github_repo', 'SelfNote-Backup'),
    branch: getSetting('github_branch', 'main'),
    backupFolder: getSetting('github_backup_folder', 'SelfNote-Backup')
  };
}

export function saveGitHubConfig(config: GitHubConfig) {
  if (config.token) {
    let enc = '';
    if (safeStorage.isEncryptionAvailable()) {
      enc = safeStorage.encryptString(config.token).toString('base64');
    } else {
      enc = Buffer.from(config.token, 'utf8').toString('base64');
    }
    setSetting('github_token_enc', enc);
  }
  setSetting('github_username', config.username);
  setSetting('github_repo', config.repo);
  setSetting('github_branch', config.branch || 'main');
  setSetting('github_backup_folder', config.backupFolder || 'SelfNote-Backup');
}

// Upload a single file to GitHub repo via Contents API
async function uploadFileToGitHub(
  owner: string,
  repo: string,
  filePath: string,
  contentStr: string,
  message: string,
  token: string,
  branch = 'main'
) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  // Get current file sha if it exists
  let sha: string | undefined;
  try {
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'SelfNote-Desktop'
      }
    });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }
  } catch {
    // File may not exist yet, which is expected
  }

  const base64Content = Buffer.from(contentStr, 'utf8').toString('base64');

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'SelfNote-Desktop'
    },
    body: JSON.stringify({
      message,
      content: base64Content,
      branch,
      ...(sha ? { sha } : {})
    })
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    throw new Error(err.message || `GitHub API error ${putRes.status}`);
  }

  return await putRes.json();
}

export async function runGitHubBackup(): Promise<{ success: boolean; message: string; timestamp: string }> {
  const config = getGitHubConfig();
  const timestamp = new Date().toISOString();

  if (!config.token || !config.username || !config.repo) {
    return {
      success: false,
      message: 'GitHub backup not configured. Please add Username, Repo, and Personal Access Token in Settings.',
      timestamp
    };
  }

  try {
    const branches = getBranches(false);
    const questions = getQuestions(undefined, false);

    const folder = config.backupFolder.replace(/\/+$/, '');

    // 1. Upload branches.json
    await uploadFileToGitHub(
      config.username,
      config.repo,
      `${folder}/branches.json`,
      JSON.stringify(branches, null, 2),
      'Backup: branches.json update',
      config.token,
      config.branch
    );

    // 2. Upload individual questions in questions/ folder
    for (const q of questions) {
      const slug = (q.title || 'problem')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const qPath = `${folder}/questions/${slug || q.id}.json`;
      const qImages = getImages(q.id);

      await uploadFileToGitHub(
        config.username,
        config.repo,
        qPath,
        JSON.stringify({ ...q, images: qImages }, null, 2),
        `Backup: ${q.title}`,
        config.token,
        config.branch
      );
    }

    // 3. Upload metadata.json
    const metadata = {
      app: 'SelfNote — Personal DSA Tracker',
      version: '1.0.0',
      lastBackup: timestamp,
      totalBranches: branches.length,
      totalQuestions: questions.length
    };

    await uploadFileToGitHub(
      config.username,
      config.repo,
      `${folder}/metadata.json`,
      JSON.stringify(metadata, null, 2),
      `Backup: sync metadata at ${timestamp}`,
      config.token,
      config.branch
    );

    setSetting('last_backup_time', timestamp);
    setSetting('last_backup_status', 'success');

    return {
      success: true,
      message: `Successfully backed up ${questions.length} questions and ${branches.length} branches to GitHub (${config.repo})`,
      timestamp
    };
  } catch (err: any) {
    setSetting('last_backup_status', 'error');
    setSetting('last_backup_error', err.message || 'Unknown error');
    return {
      success: false,
      message: `GitHub backup failed: ${err.message}`,
      timestamp
    };
  }
}

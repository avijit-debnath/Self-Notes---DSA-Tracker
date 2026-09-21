import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { getBranches, getQuestions, getImages, saveBranch, saveQuestion, saveImage, emptyTrash } from '../database/db';
import { saveImageFile } from './fileStorage';

export async function createExportZip(): Promise<Buffer> {
  const zip = new JSZip();

  const branches = getBranches(false);
  const questions = getQuestions(undefined, false);

  zip.file('branches.json', JSON.stringify(branches, null, 2));

  const questionsFolder = zip.folder('questions');
  const imagesFolder = zip.folder('images');

  for (const q of questions) {
    const slug = (q.title || 'problem')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const qImages = getImages(q.id);

    questionsFolder?.file(`${slug || q.id}.json`, JSON.stringify({ ...q, images: qImages }, null, 2));

    for (const img of qImages) {
      if (img.filePath && fs.existsSync(img.filePath)) {
        const imgBuffer = fs.readFileSync(img.filePath);
        imagesFolder?.file(path.basename(img.filePath), imgBuffer);
      }
    }
  }

  const metadata = {
    app: 'SelfNote',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    totalBranches: branches.length,
    totalQuestions: questions.length
  };
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function importFromZip(zipBuffer: Buffer, mode: 'merge' | 'replace' = 'merge'): Promise<{ success: boolean; branchesCount: number; questionsCount: number }> {
  const zip = await JSZip.loadAsync(zipBuffer);

  if (mode === 'replace') {
    emptyTrash();
  }

  let branchesCount = 0;
  let questionsCount = 0;

  // 1. Read branches.json
  const branchesFile = zip.file('branches.json');
  if (branchesFile) {
    const branchesContent = await branchesFile.async('string');
    const branches = JSON.parse(branchesContent);
    for (const b of branches) {
      saveBranch(b);
      branchesCount++;
    }
  }

  // 2. Read images if any
  const imagesFolder = zip.folder('images');
  const imageMap: Record<string, string> = {}; // oldFileName -> newFilePath
  if (imagesFolder) {
    const files = Object.keys(imagesFolder.files);
    for (const fileName of files) {
      if (!imagesFolder.files[fileName].dir) {
        const fileBuffer = await imagesFolder.files[fileName].async('nodebuffer');
        const saved = saveImageFile(fileBuffer, path.basename(fileName));
        imageMap[path.basename(fileName)] = saved.filePath;
      }
    }
  }

  // 3. Read questions
  const questionsFolder = zip.folder('questions');
  if (questionsFolder) {
    const files = Object.keys(questionsFolder.files);
    for (const fileName of files) {
      if (!questionsFolder.files[fileName].dir) {
        const content = await questionsFolder.files[fileName].async('string');
        const qData = JSON.parse(content);
        const images = qData.images || [];
        delete qData.images;

        saveQuestion(qData);
        questionsCount++;

        // Restore image references
        for (const img of images) {
          const oldName = path.basename(img.filePath || '');
          const newPath = imageMap[oldName] || img.filePath;
          saveImage({
            ...img,
            filePath: newPath
          });
        }
      }
    }
  }

  return {
    success: true,
    branchesCount,
    questionsCount
  };
}

import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import crypto from 'crypto';

function getImagesDir(): string {
  const userDataDir = app ? app.getPath('userData') : path.join(process.cwd(), 'userData');
  const imgDir = path.join(userDataDir, 'images');
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
  }
  return imgDir;
}

export function saveImageFile(dataUrlOrBuffer: string | Buffer, originalName = 'photo.png'): { id: string; filePath: string; dataUrl: string } {
  const id = 'img_' + crypto.randomBytes(8).toString('hex');
  const imagesDir = getImagesDir();

  let buffer: Buffer;
  let ext = '.png';

  if (typeof dataUrlOrBuffer === 'string') {
    if (dataUrlOrBuffer.startsWith('data:image/jpeg') || dataUrlOrBuffer.startsWith('data:image/jpg')) {
      ext = '.jpg';
    }
    const base64Data = dataUrlOrBuffer.includes(',') ? dataUrlOrBuffer.split(',')[1] : dataUrlOrBuffer;
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    ext = path.extname(originalName) || '.png';
    buffer = dataUrlOrBuffer;
  }

  const fileName = `${id}${ext}`;
  const filePath = path.join(imagesDir, fileName);
  fs.writeFileSync(filePath, buffer);

  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

  return {
    id,
    filePath,
    dataUrl
  };
}

export function readImageDataUrl(filePath: string): string {
  try {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
      return `data:${mime};base64,${buffer.toString('base64')}`;
    }
  } catch (err) {
    console.error('Error reading image file:', err);
  }
  return '';
}

export function removeImageFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    console.error('Error removing image file:', err);
  }
  return false;
}

export function readAudioDataUrl(filePath: string): string {
  try {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mime = ext === '.mp3' ? 'audio/mp3' : 'audio/webm';
      return `data:${mime};base64,${buffer.toString('base64')}`;
    }
  } catch (err) {
    console.error('Error reading audio file:', err);
  }
  return '';
}

export function removeAudioFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    console.error('Error removing audio file:', err);
  }
  return false;
}

function getAudioDir(): string {
  const userDataDir = app ? app.getPath('userData') : path.join(process.cwd(), 'userData');
  const audioDir = path.join(userDataDir, 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  return audioDir;
}

export function saveAudioFile(dataUrl: string, originalName = 'recording.webm'): { id: string; filePath: string; dataUrl: string } {
  const id = 'voice_' + crypto.randomBytes(8).toString('hex');
  const audioDir = getAudioDir();

  const ext = originalName.endsWith('.mp3') ? '.mp3' : '.webm';
  const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const buffer = Buffer.from(base64Data, 'base64');

  const fileName = `${id}${ext}`;
  const filePath = path.join(audioDir, fileName);
  fs.writeFileSync(filePath, buffer);

  const mime = ext === '.mp3' ? 'audio/mp3' : 'audio/webm';
  const cleanDataUrl = `data:${mime};base64,${buffer.toString('base64')}`;

  return {
    id,
    filePath,
    dataUrl: cleanDataUrl
  };
}

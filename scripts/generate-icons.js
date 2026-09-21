const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();

function createIcoFromPngs(pngItems) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type (1 = ICO)
  header.writeUInt16LE(pngItems.length, 4); // image count

  let offset = 6 + 16 * pngItems.length;
  const dirEntries = [];

  for (const item of pngItems) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8); // size of image in bytes
    entry.writeUInt32LE(offset, 12); // file offset
    dirEntries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngItems.map(p => p.buffer)]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    transparent: true,
    frame: false,
    webPreferences: {
      offscreen: true
    }
  });

  const svgPath = path.join(__dirname, '../public/favicon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 512px; height: 512px; background: transparent; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          svg { width: 480px; height: 480px; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await new Promise(r => setTimeout(r, 600));

  const image = await win.capturePage({ x: 0, y: 0, width: 512, height: 512 });
  const fullPng = image.toPNG();

  const buildDir = path.join(__dirname, '../build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // 1. Save 512x512 PNG
  fs.writeFileSync(path.join(buildDir, 'icon.png'), fullPng);
  fs.writeFileSync(path.join(__dirname, '../public/icon.png'), fullPng);
  console.log('Saved icon.png (512x512)');

  // 2. Generate multi-resolution icons for .ico: 256, 128, 64, 48, 32, 16
  const sizes = [256, 128, 64, 48, 32, 16];
  const pngItems = [];

  for (const size of sizes) {
    const resized = image.resize({ width: size, height: size, quality: 'best' });
    const buf = resized.toPNG();
    pngItems.push({ width: size, height: size, buffer: buf });
  }

  const icoBuffer = createIcoFromPngs(pngItems);
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
  fs.writeFileSync(path.join(__dirname, '../public/icon.ico'), icoBuffer);
  console.log('Saved icon.ico with resolutions:', sizes.join(', '));

  app.quit();
});

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();

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
  
  // Wrap SVG in HTML with 100% viewport sizing
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 512px; height: 512px; background: transparent; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          svg { width: 480px; height: 480px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.25)); }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  // Wait 500ms for rendering
  await new Promise(r => setTimeout(r, 500));

  const image = await win.capturePage({ x: 0, y: 0, width: 512, height: 512 });
  const pngBuffer = image.toPNG();

  const buildDir = path.join(__dirname, '../build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const pngPath = path.join(buildDir, 'icon.png');
  fs.writeFileSync(pngPath, pngBuffer);
  console.log('Saved 512x512 PNG to', pngPath);

  // Also save to public for runtime window icon
  fs.writeFileSync(path.join(__dirname, '../public/icon.png'), pngBuffer);

  app.quit();
});

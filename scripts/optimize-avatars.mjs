// Asset resizing/encoding only: character artwork is generated with imagegen.
import { launchBrowser } from './cdp.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
const browser = await launchBrowser();
try {
  await browser.send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
  await browser.until(`document.readyState === 'complete'`);
  await mkdir('assets/avatars', { recursive: true });
  for (let i = 1; i <= 9; i++) {
    const data = await browser.evaluate(`(async () => {
      const image = new Image(); image.src = './outputs/avatars-source/character-${i}.png';
      await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 320;
      const context = canvas.getContext('2d'); context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, 320, 320);
      return canvas.toDataURL('image/webp', .9).split(',')[1];
    })()`);
    const bytes = Buffer.from(data, 'base64');
    await writeFile(`assets/avatars/character-${i}.webp`, bytes);
    console.log(`character-${i}.webp: ${bytes.length} bytes`);
  }
} finally { await browser.close(); }

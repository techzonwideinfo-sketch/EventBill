import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const logoBase64 = fs.readFileSync('d:/project/Bill/server/assets/event-logo.png', 'base64');
  
  await page.setContent(`
    <html>
      <body>
        <canvas id="c"></canvas>
        <img id="i" src="data:image/png;base64,${logoBase64}" />
      </body>
    </html>
  `);
  
  const dataUrl = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const img = document.getElementById('i');
      img.onload = () => {
        const c = document.getElementById('c');
        const ctx = c.getContext('2d');
        const size = Math.min(img.width, img.height);
        c.width = 192;
        c.height = 192;
        const cropX = 0;
        const cropY = (img.height - size) / 2;
        ctx.drawImage(img, cropX, cropY, size, size, 0, 0, 192, 192);
        resolve(c.toDataURL('image/png'));
      };
    });
  });
  
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('d:/project/Bill/client/public/favicon.png', base64Data, 'base64');
  await browser.close();
  console.log('Favicon created via Puppeteer');
  process.exit(0);
})();

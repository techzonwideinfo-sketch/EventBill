import puppeteer from 'puppeteer';
import { generateHTML } from '../templates/billTemplate.js';
import fs from 'fs';
import path from 'path';

export const generatePdfBuffer = async (bill) => {
  const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansTamil-Regular.ttf');
  
  let fontBase64 = '';
  try {
    if (fs.existsSync(fontPath)) {
      fontBase64 = fs.readFileSync(fontPath).toString('base64');
    }
  } catch (e) {
    console.warn('Could not read Tamil font:', e);
  }
  
  const htmlContent = generateHTML(bill, fontBase64);

  const browser = await puppeteer.launch({ 
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-dev-shm-usage']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    await page.evaluate(async () => {
        await document.fonts.ready;
    });

    const bodyHeight = await page.evaluate(() => document.documentElement.offsetHeight);
    
    const pdfBuffer = await page.pdf({ 
      width: '80mm',
      height: bodyHeight + 'px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
};

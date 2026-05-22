import fs from 'fs';
import path from 'path';

/**
 * Extract raw text from an uploaded file.
 * Supports: PDF, plain text (.txt, .md, .csv)
 * Images: returns a contextual note
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
  if (!filePath || !fs.existsSync(filePath)) return '';

  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.pdf' || (await isPDF(filePath))) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdf = require('pdf-parse');
      const parser = typeof pdf === 'function' ? pdf : pdf.default;
      if (typeof parser !== 'function') {
        throw new Error('pdf-parse module resolved but no callable parser function was found');
      }
      const buffer = fs.readFileSync(filePath);
      const data = await parser(buffer);
      const text = data.text.replace(/\s+/g, ' ').trim();
      console.log(`📄 PDF extracted: ${text.length} chars`);
      return text;
    }

    if (ext === '.docx') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value.replace(/\s+/g, ' ').trim();
      console.log(`📄 DOCX extracted: ${text.length} chars`);
      return text;
    }

    if (['.txt', '.md', '.csv'].includes(ext)) {
      return fs.readFileSync(filePath, 'utf-8').trim();
    }

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      return '[IMAGE_REFERENCE: Teacher uploaded a diagram/image as reference.]';
    }

    return '';
  } catch (err: any) {
    console.warn(`⚠️  File extraction failed: ${err.message}`);
    return '';
  }
}

async function isPDF(filePath: string): Promise<boolean> {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf.toString('ascii', 0, 4) === '%PDF';
  } catch {
    return false;
  }
}

'use strict';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { uploadImageToCloudinary } from './cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../public/uploads');

function getExtension(contentType, filename) {
  const filenameExtension = path.extname(filename || '').toLowerCase();
  if (filenameExtension) {
    return filenameExtension;
  }

  const extensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif'
  };

  return extensions[contentType] || '.jpg';
}

function parseHeaders(headerText) {
  return headerText.split('\r\n').reduce((headers, line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex !== -1) {
      const name = line.slice(0, separatorIndex).trim().toLowerCase();
      headers[name] = line.slice(separatorIndex + 1).trim();
    }
    return headers;
  }, {});
}

function parseContentDisposition(value) {
  const result = {};
  value.split(';').forEach(part => {
    const [key, rawValue] = part.trim().split('=');
    if (rawValue) {
      result[key] = rawValue.replace(/^"|"$/g, '');
    }
  });
  return result;
}

async function saveFile(fieldName, filename, contentType, data) {
  if (!contentType.startsWith('image/') || data.length === 0) {
    return null;
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const extension = getExtension(contentType, filename);
  const safeFilename = `${fieldName}-${Date.now()}-${crypto.randomUUID()}${extension}`;
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  fs.writeFileSync(filePath, data);
  const localPath = `/uploads/${safeFilename}`;
  let cloudinaryPath = null;
  try {
    cloudinaryPath = await uploadImageToCloudinary(data, safeFilename, contentType);
  } catch {
    cloudinaryPath = null;
  }
  return cloudinaryPath || localPath;
}

export default function upload(request, response, next) {
  const contentType = request.headers['content-type'] || '';

  if (!contentType.startsWith('multipart/form-data')) {
    return next();
  }

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!boundaryMatch) {
    return next();
  }

  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const chunks = [];

  request.on('data', chunk => chunks.push(chunk));
  request.on('end', async () => {
    const body = Buffer.concat(chunks).toString('latin1');
    const parts = body.split(`--${boundary}`);
    request.body = {};
    request.files = {};

    for (const part of parts) {
      if (!part || part === '--\r\n' || part === '--') {
        continue;
      }

      const cleanPart = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
      const headerEndIndex = cleanPart.indexOf('\r\n\r\n');
      if (headerEndIndex === -1) {
        continue;
      }

      const headerText = cleanPart.slice(0, headerEndIndex);
      const rawValue = cleanPart.slice(headerEndIndex + 4);
      const headers = parseHeaders(headerText);
      const disposition = parseContentDisposition(headers['content-disposition'] || '');
      const fieldName = disposition.name;

      if (!fieldName) {
        continue;
      }

      if (disposition.filename) {
        const fileData = Buffer.from(rawValue, 'latin1');
        const savedPath = await saveFile(fieldName, disposition.filename, headers['content-type'] || '', fileData);
        if (savedPath) {
          request.files[fieldName] = {
            path: savedPath,
            originalName: disposition.filename,
            contentType: headers['content-type']
          };
        }
      } else {
        request.body[fieldName] = rawValue;
      }
    }

    next();
  });
}

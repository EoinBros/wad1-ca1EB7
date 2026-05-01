'use strict';

import crypto from 'crypto';

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function createSignature(params) {
  const signatureBase = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(`${signatureBase}${process.env.CLOUDINARY_API_SECRET}`)
    .digest('hex');
}

export async function uploadImageToCloudinary(buffer, filename, contentType) {
  if (!hasCloudinaryConfig()) {
    return null;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    folder: 'clothing-store-front',
    timestamp
  };

  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: contentType }), filename);
  formData.append('api_key', process.env.CLOUDINARY_API_KEY);
  formData.append('folder', params.folder);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', createSignature(params));

  const url = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  return result.secure_url || null;
}

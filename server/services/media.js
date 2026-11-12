import crypto from 'crypto';

/**
 * Cloud media service for course thumbnails, avatars, and lesson videos (Cloudinary).
 */

export function getMediaStatus() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const configured = Boolean(cloudName && apiKey && apiSecret);
  return {
    provider: configured ? 'cloudinary' : 'none',
    configured,
    cloudName: cloudName || null,
  };
}

export function createCloudinarySignature({ folder = 'ample-lms', resourceType = 'auto' } = {}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const safeFolder = String(folder || 'ample-lms').replace(/[^a-zA-Z0-9/_-]/g, '');
  const safeType = ['image', 'video', 'raw', 'auto'].includes(resourceType) ? resourceType : 'auto';
  const paramsToSign = `folder=${safeFolder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(`${paramsToSign}${apiSecret}`)
    .digest('hex');

  return {
    cloudName,
    apiKey,
    timestamp,
    folder: safeFolder,
    resourceType: safeType,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${safeType}/upload`,
  };
}


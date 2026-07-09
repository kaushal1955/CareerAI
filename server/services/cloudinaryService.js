import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

export async function uploadResumeAsset(localPath) {
  if (!isCloudinaryConfigured()) {
    return {
      provider: 'local',
      fileUrl: '',
      publicId: '',
    };
  }

  const result = await cloudinary.uploader.upload(localPath, {
    folder: 'careerai/resumes',
    resource_type: 'raw',
    use_filename: true,
    unique_filename: true,
  });

  return {
    provider: 'cloudinary',
    fileUrl: result.secure_url,
    publicId: result.public_id,
  };
}

export async function deleteResumeAsset(publicId) {
  if (!publicId || !isCloudinaryConfigured()) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'raw',
    type: 'upload',
    invalidate: true,
  });
}

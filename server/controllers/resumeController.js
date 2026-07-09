import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import Profile from '../models/Profile.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { analyzeResume } from '../services/aiService.js';
import { deleteResumeAsset, uploadResumeAsset } from '../services/cloudinaryService.js';

async function findDbUser(req) {
  const userId = req.userId;

  if (!userId) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User record not found. Sync the authenticated user first.');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

async function findResumeForUser(req) {
  const user = await findDbUser(req);
  const resume = await Resume.findOne({ _id: req.params.resumeId, user: user._id });

  if (!resume) {
    const error = new Error('Resume not found.');
    error.statusCode = 404;
    throw error;
  }

  return { user, resume };
}

function buildLocalFileUrl(req, fileName) {
  return `${req.protocol}://${req.get('host')}/uploads/resumes/${fileName}`;
}

async function extractResumeTextFromPdf(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const result = await pdfParse(fileBuffer);
    return (result.text || '')
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch (error) {
    console.error('PDF text extraction failed:', error.message);
    return '';
  }
}

function setResumeHeaders(res, resume, dispositionType) {
  const safeFileName = (resume.originalFileName || 'resume.pdf').replace(/[\r\n"]/g, '').trim() || 'resume.pdf';
  res.setHeader('Content-Type', resume.mimeType || 'application/pdf');
  res.setHeader('Content-Disposition', `${dispositionType}; filename="${safeFileName}"`);
}

async function safeUnlink(filePath) {
  if (!filePath) return;
  await fs.unlink(filePath).catch(() => null);
}

async function removeStoredResumeAsset(resumeLike) {
  const localPath = resumeLike?.storage?.localPath;
  const publicId = resumeLike?.storage?.publicId;
  await safeUnlink(localPath);
  if (publicId) {
    await deleteResumeAsset(publicId).catch((error) => {
      console.error('Cloudinary delete skipped:', error.message);
    });
  }
}

async function streamResumeFile(resume, res, dispositionType = 'inline') {
  setResumeHeaders(res, resume, dispositionType);

  if (resume.storage?.provider === 'cloudinary' && resume.storage?.fileUrl) {
    const response = await fetch(resume.storage.fileUrl);

    if (!response.ok) {
      const error = new Error('Unable to fetch the stored resume file.');
      error.statusCode = 502;
      throw error;
    }

    const arrayBuffer = await response.arrayBuffer();
    res.status(200).send(Buffer.from(arrayBuffer));
    return;
  }

  const localPath = resume.storage?.localPath;

  if (!localPath) {
    const error = new Error('Resume file path is missing.');
    error.statusCode = 404;
    throw error;
  }

  try {
    await fs.access(localPath);
  } catch {
    const error = new Error('Stored resume file could not be found.');
    error.statusCode = 404;
    throw error;
  }

  res.sendFile(path.resolve(localPath));
}

async function buildStoredResumePayload({ req, filePath, file, preferredCareer }) {
  const extractedText = await extractResumeTextFromPdf(filePath);

  let asset = {
    provider: 'local',
    fileUrl: '',
    publicId: '',
  };

  try {
    asset = await uploadResumeAsset(filePath);
  } catch (error) {
    console.error('Cloudinary upload fallback triggered:', error.message);
  }

  const analysis = await analyzeResume({ resumeText: extractedText, preferredCareer });
  const useCloudinary = asset.provider === 'cloudinary';

  return {
    originalFileName: file.originalname,
    storedFileName: file.filename,
    mimeType: file.mimetype,
    fileSize: file.size,
    storage: {
      provider: asset.provider || 'local',
      localPath: useCloudinary ? '' : file.path,
      fileUrl: asset.fileUrl || buildLocalFileUrl(req, file.filename),
      publicId: asset.publicId || '',
    },
    extractedText,
    preferredCareerAtUpload: preferredCareer,
    analysisStatus: 'completed',
    analysis,
    lastAnalyzedAt: new Date(),
    shouldDeleteTempFile: useCloudinary,
  };
}

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a PDF resume file.');
  }

  const user = await findDbUser(req);
  const profile = await Profile.findOne({ user: user._id });
  const preferredCareer = String(req.body.preferredCareer || profile?.preferredCareer || '').trim();
  const payload = await buildStoredResumePayload({
    req,
    filePath: req.file.path,
    file: req.file,
    preferredCareer,
  });

  const resume = await Resume.create({
    user: user._id,
    ...payload,
  });

  if (payload.shouldDeleteTempFile) {
    await safeUnlink(req.file.path);
  }

  res.status(201).json({
    success: true,
    message: 'Resume uploaded and analyzed successfully.',
    resume,
  });
});

export const getLatestResume = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const resume = await Resume.findOne({ user: user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    resume,
  });
});

export const getMyResumes = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const resumes = await Resume.find({ user: user._id })
    .sort({ createdAt: -1 })
    .select('-extractedText');

  res.status(200).json({
    success: true,
    count: resumes.length,
    resumes,
  });
});

export const previewResumeFile = asyncHandler(async (req, res) => {
  const { resume } = await findResumeForUser(req);
  await streamResumeFile(resume, res, 'inline');
});

export const downloadResumeFile = asyncHandler(async (req, res) => {
  const { resume } = await findResumeForUser(req);
  await streamResumeFile(resume, res, 'attachment');
});

export const replaceResumeFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a new PDF resume file to replace the current one.');
  }

  const { user, resume } = await findResumeForUser(req);
  const profile = await Profile.findOne({ user: user._id });
  const preferredCareer = String(req.body.preferredCareer || profile?.preferredCareer || resume.preferredCareerAtUpload || '').trim();

  const payload = await buildStoredResumePayload({
    req,
    filePath: req.file.path,
    file: req.file,
    preferredCareer,
  });

  const previousStorage = {
    storage: {
      localPath: resume.storage?.localPath || '',
      publicId: resume.storage?.publicId || '',
    },
  };

  resume.originalFileName = payload.originalFileName;
  resume.storedFileName = payload.storedFileName;
  resume.mimeType = payload.mimeType;
  resume.fileSize = payload.fileSize;
  resume.storage = payload.storage;
  resume.extractedText = payload.extractedText;
  resume.preferredCareerAtUpload = payload.preferredCareerAtUpload;
  resume.analysisStatus = payload.analysisStatus;
  resume.analysis = payload.analysis;
  resume.lastAnalyzedAt = payload.lastAnalyzedAt;
  await resume.save();

  await removeStoredResumeAsset(previousStorage);
  if (payload.shouldDeleteTempFile) {
    await safeUnlink(req.file.path);
  }

  res.status(200).json({
    success: true,
    message: 'Resume replaced and analyzed successfully.',
    resume,
  });
});

export const deleteResume = asyncHandler(async (req, res) => {
  const { resume } = await findResumeForUser(req);
  await removeStoredResumeAsset(resume);
  await resume.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Resume deleted successfully.',
  });
});

export const reanalyzeResume = asyncHandler(async (req, res) => {
  const { user, resume } = await findResumeForUser(req);
  const profile = await Profile.findOne({ user: user._id });
  const preferredCareer = String(req.body.preferredCareer || profile?.preferredCareer || resume.preferredCareerAtUpload || '').trim();
  const analysis = await analyzeResume({
    resumeText: resume.extractedText,
    preferredCareer,
  });

  resume.analysis = analysis;
  resume.preferredCareerAtUpload = preferredCareer;
  resume.analysisStatus = 'completed';
  resume.lastAnalyzedAt = new Date();
  await resume.save();

  res.status(200).json({
    success: true,
    message: 'Resume reanalyzed successfully.',
    resume,
  });
});

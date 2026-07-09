import CareerRecommendation from '../models/CareerRecommendation.js';
import Profile from '../models/Profile.js';
import Resume from '../models/Resume.js';
import SkillGap from '../models/SkillGap.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildSkillGapReport } from '../services/skillGapService.js';

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

export const getLatestSkillGap = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const skillGap = await SkillGap.findOne({ user: user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    skillGap,
  });
});

export const generateSkillGap = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const profile = await Profile.findOne({ user: user._id });

  if (!profile) {
    res.status(400);
    throw new Error('Please complete your profile before generating a skill-gap analysis.');
  }

  const [latestResume, latestRecommendation] = await Promise.all([
    Resume.findOne({ user: user._id }).sort({ createdAt: -1 }),
    CareerRecommendation.findOne({ user: user._id }).sort({ createdAt: -1 }),
  ]);

  const report = buildSkillGapReport({
    profile: profile.toObject(),
    resume: latestResume,
    latestRecommendation,
  });

  if (!report) {
    res.status(400);
    throw new Error('Unable to determine a target career for skill-gap analysis.');
  }

  const skillGap = await SkillGap.create({
    user: user._id,
    sourceResume: latestResume?._id || null,
    ...report,
  });

  res.status(201).json({
    success: true,
    message: 'Skill-gap analysis generated successfully.',
    skillGap,
  });
});

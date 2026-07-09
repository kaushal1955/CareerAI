import CareerRecommendation from '../models/CareerRecommendation.js';
import Profile from '../models/Profile.js';
import Resume from '../models/Resume.js';
import Roadmap from '../models/Roadmap.js';
import SkillGap from '../models/SkillGap.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildLearningRoadmap } from '../services/roadmapService.js';
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

export const getLatestRoadmap = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const roadmap = await Roadmap.findOne({ user: user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    roadmap,
  });
});

export const generateRoadmap = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const profile = await Profile.findOne({ user: user._id });

  if (!profile) {
    res.status(400);
    throw new Error('Please complete your profile before generating a learning roadmap.');
  }

  const [latestResume, latestRecommendation, latestSkillGap] = await Promise.all([
    Resume.findOne({ user: user._id }).sort({ createdAt: -1 }),
    CareerRecommendation.findOne({ user: user._id }).sort({ createdAt: -1 }),
    SkillGap.findOne({ user: user._id }).sort({ createdAt: -1 }),
  ]);

  const fallbackSkillGap = latestSkillGap
    ? latestSkillGap.toObject()
    : buildSkillGapReport({
        profile: profile.toObject(),
        resume: latestResume,
        latestRecommendation,
      });

  const roadmapPayload = buildLearningRoadmap({
    profile: profile.toObject(),
    resume: latestResume,
    latestRecommendation,
    latestSkillGap: fallbackSkillGap,
  });

  if (!roadmapPayload) {
    res.status(400);
    throw new Error('Unable to generate a roadmap because target career data is missing.');
  }

  const roadmap = await Roadmap.create({
    user: user._id,
    sourceSkillGap: latestSkillGap?._id || null,
    sourceResume: latestResume?._id || null,
    ...roadmapPayload,
  });

  res.status(201).json({
    success: true,
    message: 'Learning roadmap generated successfully.',
    roadmap,
  });
});

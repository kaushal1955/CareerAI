import CareerRecommendation from '../models/CareerRecommendation.js';
import Profile from '../models/Profile.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildCareerRecommendations } from '../services/careerRecommendationService.js';

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

export const getLatestCareerRecommendation = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const recommendation = await CareerRecommendation.findOne({ user: user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    recommendation,
  });
});

export const generateCareerRecommendation = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const profile = await Profile.findOne({ user: user._id });

  if (!profile) {
    res.status(400);
    throw new Error('Please complete your profile before generating career recommendations.');
  }

  const latestResume = await Resume.findOne({ user: user._id }).sort({ createdAt: -1 });
  const recommendations = buildCareerRecommendations({
    profile: profile.toObject(),
    resume: latestResume,
  });

  const recommendation = await CareerRecommendation.create({
    user: user._id,
    sourceResume: latestResume?._id || null,
    basedOnPreferredCareer: profile.preferredCareer || '',
    topCareerPath: recommendations[0]?.careerPath || '',
    recommendations,
    generatedWithAI: false,
  });

  res.status(201).json({
    success: true,
    message: 'Career recommendations generated successfully.',
    recommendation,
  });
});

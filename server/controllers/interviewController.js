import CareerRecommendation from '../models/CareerRecommendation.js';
import Interview from '../models/Interview.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { evaluateInterviewAnswers, generateInterviewSession } from '../services/interviewService.js';

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

export const getLatestInterview = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const interview = await Interview.findOne({ user: user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    interview,
  });
});

export const generateInterview = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const profile = await Profile.findOne({ user: user._id });

  if (!profile) {
    res.status(400);
    throw new Error('Please complete your profile before generating a mock interview.');
  }

  const latestRecommendation = await CareerRecommendation.findOne({ user: user._id }).sort({ createdAt: -1 });
  const payload = generateInterviewSession({
    profile: profile.toObject(),
    latestRecommendation,
    interviewType: req.body.interviewType,
  });

  if (!payload) {
    res.status(400);
    throw new Error('Unable to determine a target career for interview generation.');
  }

  const interview = await Interview.create({
    user: user._id,
    ...payload,
  });

  res.status(201).json({
    success: true,
    message: 'Mock interview generated successfully.',
    interview,
  });
});

export const evaluateInterview = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const interview = await Interview.findOne({ _id: req.params.interviewId, user: user._id });

  if (!interview) {
    res.status(404);
    throw new Error('Interview session not found.');
  }

  const evaluation = evaluateInterviewAnswers({
    interview: interview.toObject(),
    answers: req.body.answers,
  });

  interview.answers = evaluation.answers;
  interview.performanceScore = evaluation.performanceScore;
  interview.feedbackSummary = evaluation.feedbackSummary;
  interview.strengths = evaluation.strengths;
  interview.weakAreas = evaluation.weakAreas;
  interview.improvementSuggestions = evaluation.improvementSuggestions;
  interview.perQuestionFeedback = evaluation.perQuestionFeedback;
  interview.status = evaluation.status;
  await interview.save();

  res.status(200).json({
    success: true,
    message: 'Interview evaluated successfully.',
    interview,
  });
});

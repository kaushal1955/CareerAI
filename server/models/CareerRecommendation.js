import mongoose from 'mongoose';

const { Schema } = mongoose;

const recommendationItemSchema = new Schema(
  {
    careerPath: { type: String, trim: true, required: true },
    matchPercentage: { type: Number, min: 0, max: 100, required: true },
    summary: { type: String, trim: true, default: '' },
    salaryRangeIndia: { type: String, trim: true, default: '' },
    growthOutlook: { type: String, trim: true, default: '' },
    futureDemand: { type: String, trim: true, default: '' },
    requiredSkills: [{ type: String, trim: true }],
    existingSkills: [{ type: String, trim: true }],
    missingSkills: [{ type: String, trim: true }],
    recommendedCourses: [{ type: String, trim: true }],
    suggestedProjects: [{ type: String, trim: true }],
    estimatedLearningDuration: { type: String, trim: true, default: '' },
    whyItFits: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const careerRecommendationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sourceResume: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    basedOnPreferredCareer: { type: String, trim: true, default: '' },
    topCareerPath: { type: String, trim: true, default: '' },
    recommendations: [recommendationItemSchema],
    generatedWithAI: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

careerRecommendationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('CareerRecommendation', careerRecommendationSchema);

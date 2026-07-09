import mongoose from 'mongoose';

const { Schema } = mongoose;

const priorityItemSchema = new Schema(
  {
    skill: { type: String, trim: true, required: true },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    reason: { type: String, trim: true, default: '' },
    recommendedCourse: { type: String, trim: true, default: '' },
    practiceProject: { type: String, trim: true, default: '' },
    estimatedWeeks: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const skillGapSchema = new Schema(
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
    targetCareer: { type: String, trim: true, required: true },
    basedOnRecommendation: { type: String, trim: true, default: '' },
    currentSkills: [{ type: String, trim: true }],
    existingSkills: [{ type: String, trim: true }],
    missingSkills: [{ type: String, trim: true }],
    matchPercentage: { type: Number, min: 0, max: 100, default: 0 },
    recommendedCourses: [{ type: String, trim: true }],
    suggestedProjects: [{ type: String, trim: true }],
    estimatedLearningDuration: { type: String, trim: true, default: '' },
    priorities: [priorityItemSchema],
    summary: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
  },
);

skillGapSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('SkillGap', skillGapSchema);

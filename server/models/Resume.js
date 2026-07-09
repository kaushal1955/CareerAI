import mongoose from 'mongoose';

const { Schema } = mongoose;

const analysisSchema = new Schema(
  {
    summary: { type: String, default: '' },
    atsScore: { type: Number, min: 0, max: 100, default: 0 },
    strengths: [{ type: String, trim: true }],
    improvements: [{ type: String, trim: true }],
    missingKeywords: [{ type: String, trim: true }],
    extractedSkills: [{ type: String, trim: true }],
    recommendedRoles: [{ type: String, trim: true }],
    projectSuggestions: [{ type: String, trim: true }],
    courseSuggestions: [{ type: String, trim: true }],
    keywordOptimizationTips: [{ type: String, trim: true }],
  },
  { _id: false },
);

const resumeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    storedFileName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    storage: {
      provider: {
        type: String,
        enum: ['local', 'cloudinary'],
        default: 'local',
      },
      localPath: { type: String, default: '' },
      fileUrl: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    extractedText: {
      type: String,
      default: '',
    },
    preferredCareerAtUpload: {
      type: String,
      default: '',
      trim: true,
    },
    analysisStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    analysis: {
      type: analysisSchema,
      default: () => ({}),
    },
    lastAnalyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

resumeSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Resume', resumeSchema);

import mongoose from 'mongoose';

const { Schema } = mongoose;

const roadmapStageSchema = new Schema(
  {
    title: { type: String, trim: true, required: true },
    weekRange: { type: String, trim: true, default: '' },
    goal: { type: String, trim: true, default: '' },
    topics: [{ type: String, trim: true }],
    courses: [{ type: String, trim: true }],
    practiceItems: [{ type: String, trim: true }],
    miniProjects: [{ type: String, trim: true }],
    milestone: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
  },
  { _id: false },
);

const roadmapSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sourceSkillGap: {
      type: Schema.Types.ObjectId,
      ref: 'SkillGap',
      default: null,
    },
    sourceResume: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    targetCareer: { type: String, trim: true, required: true },
    summary: { type: String, trim: true, default: '' },
    estimatedDuration: { type: String, trim: true, default: '' },
    stages: [roadmapStageSchema],
  },
  {
    timestamps: true,
  },
);

roadmapSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Roadmap', roadmapSchema);

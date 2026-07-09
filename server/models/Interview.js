import mongoose from 'mongoose';

const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    question: { type: String, trim: true, required: true },
    category: { type: String, trim: true, default: '' },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    expectedPoints: [{ type: String, trim: true }],
  },
  { _id: false },
);

const answerSchema = new Schema(
  {
    questionIndex: { type: Number, required: true, min: 0 },
    answer: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const feedbackSchema = new Schema(
  {
    questionIndex: { type: Number, required: true, min: 0 },
    score: { type: Number, min: 0, max: 100, default: 0 },
    feedback: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const interviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetCareer: { type: String, trim: true, required: true },
    interviewType: {
      type: String,
      enum: ['hr', 'technical', 'behavioral', 'coding'],
      default: 'technical',
    },
    questions: [questionSchema],
    answers: [answerSchema],
    status: {
      type: String,
      enum: ['generated', 'completed'],
      default: 'generated',
    },
    performanceScore: { type: Number, min: 0, max: 100, default: 0 },
    feedbackSummary: { type: String, trim: true, default: '' },
    strengths: [{ type: String, trim: true }],
    weakAreas: [{ type: String, trim: true }],
    improvementSuggestions: [{ type: String, trim: true }],
    perQuestionFeedback: [feedbackSchema],
  },
  {
    timestamps: true,
  },
);

interviewSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Interview', interviewSchema);

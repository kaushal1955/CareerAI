import mongoose from 'mongoose';

const { Schema } = mongoose;

const mentorResourceSchema = new Schema(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'Mentor',
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    url: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [{ type: String, trim: true }],
    visibility: {
      type: String,
      enum: ['all-assigned', 'specific-student'],
      default: 'all-assigned',
    },
    moderationStatus: {
      type: String,
      enum: ['approved', 'flagged', 'hidden'],
      default: 'approved',
    },
    moderationNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

mentorResourceSchema.index({ mentor: 1, createdAt: -1 });

export default mongoose.model('MentorResource', mentorResourceSchema);

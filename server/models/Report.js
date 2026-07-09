import mongoose from 'mongoose';

const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['bug', 'mentor', 'user', 'resource', 'chat', 'content', 'other'],
      default: 'other',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    subject: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    targetType: {
      type: String,
      trim: true,
      default: 'general',
    },
    targetId: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'in-review', 'resolved', 'dismissed'],
      default: 'open',
    },
    adminResponse: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Report', reportSchema);

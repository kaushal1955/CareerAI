import mongoose from 'mongoose';

const { Schema } = mongoose;

const mentorSessionSchema = new Schema(
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
      required: true,
      index: true,
    },
    topic: {
      type: String,
      trim: true,
      required: true,
    },
    agenda: {
      type: String,
      trim: true,
      default: '',
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    sessionType: {
      type: String,
      enum: ['video', 'phone', 'chat', 'in-person'],
      default: 'video',
    },
    meetingProvider: {
      type: String,
      enum: ['google-meet', 'zoom', 'teams', 'custom', 'none'],
      default: 'google-meet',
    },
    durationMinutes: {
      type: Number,
      min: 15,
      max: 240,
      default: 30,
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    meetingCode: {
      type: String,
      trim: true,
      default: '',
    },
    joinInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

mentorSessionSchema.index({ mentor: 1, scheduledFor: 1 });

export default mongoose.model('MentorSession', mentorSessionSchema);

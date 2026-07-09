import mongoose from 'mongoose';

const { Schema } = mongoose;

const mentorSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    headline: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    expertise: [{ type: String, trim: true }],
    availability: {
      type: String,
      trim: true,
      default: '',
    },
    assignedStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    sessionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    resourceCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Mentor', mentorSchema);

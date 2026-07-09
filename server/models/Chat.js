import mongoose from 'mongoose';

const { Schema } = mongoose;

const chatSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

chatSchema.index({ sender: 1, recipient: 1, createdAt: 1 });

export default mongoose.model('Chat', chatSchema);

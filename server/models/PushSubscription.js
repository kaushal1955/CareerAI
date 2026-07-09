import mongoose from 'mongoose';

const { Schema } = mongoose;

const pushSubscriptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    expirationTime: {
      type: Number,
      default: null,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    deviceLabel: {
      type: String,
      default: '',
      trim: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

pushSubscriptionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('PushSubscription', pushSubscriptionSchema);

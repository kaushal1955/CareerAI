import mongoose from 'mongoose';

const { Schema } = mongoose;

const educationSchema = new Schema(
  {
    institution: { type: String, trim: true, default: '' },
    degree: { type: String, trim: true, default: '' },
    fieldOfStudy: { type: String, trim: true, default: '' },
    startYear: { type: Number, min: 1900, max: 2100 },
    endYear: { type: Number, min: 1900, max: 2100 },
    grade: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const certificationSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    issuer: { type: String, trim: true, default: '' },
    issueDate: { type: Date },
    credentialUrl: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const projectSchema = new Schema(
  {
    title: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    techStack: [{ type: String, trim: true }],
  },
  { _id: false },
);

const profileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    headline: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    education: [educationSchema],
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    certifications: [certificationSchema],
    projects: [projectSchema],
    preferredCareer: { type: String, trim: true, default: '' },
    socialLinks: {
      github: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
      portfolio: { type: String, trim: true, default: '' },
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Profile', profileSchema);

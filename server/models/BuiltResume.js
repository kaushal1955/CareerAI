import mongoose from 'mongoose';

const { Schema } = mongoose;

const basicsSchema = new Schema(
  {
    fullName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
    github: { type: String, trim: true, default: '' },
    portfolio: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const experienceSchema = new Schema(
  {
    company: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' },
    startDate: { type: String, trim: true, default: '' },
    endDate: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    highlights: [{ type: String, trim: true }],
  },
  { _id: false },
);

const educationSchema = new Schema(
  {
    institution: { type: String, trim: true, default: '' },
    degree: { type: String, trim: true, default: '' },
    fieldOfStudy: { type: String, trim: true, default: '' },
    startYear: { type: String, trim: true, default: '' },
    endYear: { type: String, trim: true, default: '' },
    grade: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const projectSchema = new Schema(
  {
    title: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    link: { type: String, trim: true, default: '' },
    highlights: [{ type: String, trim: true }],
  },
  { _id: false },
);

const certificationSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    issuer: { type: String, trim: true, default: '' },
    year: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const builtResumeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, trim: true, default: 'Professional Resume' },
    template: {
      type: String,
      enum: ['professional'],
      default: 'professional',
    },
    basics: {
      type: basicsSchema,
      default: () => ({}),
    },
    summary: { type: String, trim: true, default: '' },
    skills: [{ type: String, trim: true }],
    experience: [experienceSchema],
    education: [educationSchema],
    projects: [projectSchema],
    certifications: [certificationSchema],
    achievements: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('BuiltResume', builtResumeSchema);

import mongoose, { Document, Model, Schema } from 'mongoose';
import { AuditSchema, IAudit, slugify } from './shared';

export interface ICourse extends Document, IAudit {
  title: string;
  slug: string;
  instructorName: string;
  categoryName: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  oldPrice?: number;
  rating: number;
  imageUrl: string;
  pdfAsset?: mongoose.Types.ObjectId;
  isPublished: boolean;
  subtitle?: string;
  language?: string;
  includes?: string[];
  learningHighlights?: string[];
  description?: string[];
  skills?: string[];
  requirements?: string[];
  audience?: string[];
  faqs?: { question: string; answer: string }[];
}

const LessonSchema = new Schema({
  title: { type: String, required: true, trim: true },
  duration: { type: String, default: '', trim: true },
  preview: { type: Boolean, default: false },
}, { _id: false });

const CurriculumSectionSchema = new Schema({
  sectionTitle: { type: String, required: true, trim: true },
  lessons: { type: [LessonSchema], default: [] },
}, { _id: false });

const InstructorSchema = new Schema({
  name: { type: String, trim: true },
  title: { type: String, trim: true },
  image: { type: String, trim: true },
  bio: { type: String, trim: true },
  courses: { type: Number, min: 0 },
  students: { type: Number, min: 0 },
  rating: { type: Number, min: 0, max: 5 },
}, { _id: false });

const CourseSchema = new Schema<any>({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
  },
  instructorName: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true,
  },
  categoryName: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  oldPrice: {
    type: Number,
    min: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  imageUrl: {
    type: String,
    required: [true, 'Course image URL is required'],
    trim: true,
  },
  shortDescription: { type: String, trim: true },
  subtitle: { type: String, trim: true },
  description: { type: Schema.Types.Mixed },
  thumbnail: { type: String, trim: true },
  bannerImage: { type: String, trim: true },
  duration: { type: String, trim: true },
  lessons: { type: Number, min: 0 },
  language: { type: String, trim: true },
  certificate: { type: Boolean, default: false },
  students: { type: Number, min: 0, default: 0 },
  totalReviews: { type: Number, min: 0, default: 0 },
  instructor: { type: InstructorSchema },
  requirements: { type: [String], default: [] },
  learningOutcomes: { type: [String], default: [] },
  learningHighlights: { type: [String], default: [] },
  keyPoints: { type: [String], default: [] },
  skills: { type: [String], default: [] },
  audience: { type: [String], default: [] },
  includes: { type: [String], default: [] },
  curriculum: { type: [CurriculumSectionSchema], default: [] },
  faqs: {
    type: [{ question: String, answer: String, _id: false }],
    default: [],
  },
  reviews: {
    type: [{
      name: String,
      avatar: String,
      rating: { type: Number, min: 0, max: 5 },
      title: String,
      comment: String,
      date: String,
      _id: false,
    }],
    default: [],
  },
  pdfAsset: {
    type: Schema.Types.ObjectId,
    ref: 'CoursePdf',
  },
  isPublished: {
    type: Boolean,
    default: true,
    required: true,
  },
  isDeleted: AuditSchema.path('isDeleted'),
  deletedAt: AuditSchema.path('deletedAt'),
  deletedBy: AuditSchema.path('deletedBy'),
  createdBy: AuditSchema.path('createdBy'),
  updatedBy: AuditSchema.path('updatedBy'),
}, {
  timestamps: true,
});

CourseSchema.index({ slug: 1 }, { unique: true });
CourseSchema.index({ categoryName: 1 });
CourseSchema.index({ title: 'text' }, { language_override: 'dummyLanguageField' });
CourseSchema.index({ isDeleted: 1 });

CourseSchema.pre('validate', function (this: ICourse, next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title);
  }
  next();
});

CourseSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;

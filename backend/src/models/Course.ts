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
}

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
CourseSchema.index({ title: 'text' });
CourseSchema.index({ isDeleted: 1 });

CourseSchema.pre('validate', function (this: ICourse, next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
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

import mongoose, { Document, Model, Schema } from 'mongoose';
import { AuditSchema, IAudit, slugify } from './shared';

export interface ICategory extends Document, IAudit {
  name: string;
  slug: string;
  iconUrl: string;
}

const CategorySchema = new Schema<any>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
  },
  iconUrl: {
    type: String,
    required: [true, 'Category icon URL is required'],
    trim: true,
  },
  isDeleted: AuditSchema.path('isDeleted'),
  deletedAt: AuditSchema.path('deletedAt'),
  deletedBy: AuditSchema.path('deletedBy'),
  createdBy: AuditSchema.path('createdBy'),
  updatedBy: AuditSchema.path('updatedBy'),
}, {
  timestamps: true,
});

CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ isDeleted: 1 });

CategorySchema.pre('validate', function (this: ICategory, next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name);
  }
  next();
});

CategorySchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;

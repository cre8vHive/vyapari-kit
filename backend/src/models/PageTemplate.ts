import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAudit, AuditSchema } from './shared';

export interface IPageTemplate extends Document, IAudit {
  name: string;
  key: string;
  description?: string;
}

const PageTemplateSchema = new Schema<any>({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
  },
  key: {
    type: String,
    required: [true, 'Template key is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // Embed Audit details
  isDeleted: AuditSchema.path('isDeleted'),
  deletedAt: AuditSchema.path('deletedAt'),
  deletedBy: AuditSchema.path('deletedBy'),
  createdBy: AuditSchema.path('createdBy'),
  updatedBy: AuditSchema.path('updatedBy'),
}, {
  timestamps: true,
});

// ----------------------------------------------------
// Indexes
// ----------------------------------------------------
PageTemplateSchema.index({ key: 1 }, { unique: true });
PageTemplateSchema.index({ isDeleted: 1 });

// ----------------------------------------------------
// Query Middleware (Soft Delete Filter)
// ----------------------------------------------------
PageTemplateSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Middleware for count operations
PageTemplateSchema.pre('countDocuments', function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const PageTemplate: Model<IPageTemplate> = mongoose.models.PageTemplate || mongoose.model<IPageTemplate>('PageTemplate', PageTemplateSchema);

export default PageTemplate;

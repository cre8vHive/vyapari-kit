import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAudit, ISEO, AuditSchema, SEOSchema, slugify } from './shared';

export interface IPageSection {
  type: string;
  order: number;
  config: Record<string, any>;
}

export interface IPage extends Document, IAudit {
  title: string;
  slug: string;
  template: mongoose.Types.ObjectId; // Ref: PageTemplate
  seo: ISEO;
  sections: IPageSection[];
}

const PageSectionSchema = new Schema<any>({
  type: {
    type: String,
    required: [true, 'Section type is required'],
    trim: true,
  },
  order: {
    type: Number,
    required: [true, 'Section order is required'],
  },
  config: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, { _id: true }); // Keep _id on sections for client-side list keying

const PageSchema = new Schema<any>({
  title: {
    type: String,
    required: [true, 'Page title is required'],
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
  },
  template: {
    type: Schema.Types.ObjectId,
    ref: 'PageTemplate',
    required: [true, 'Page template is required'],
  },
  seo: {
    type: SEOSchema,
    required: true,
    default: () => ({ noIndex: false }),
  },
  sections: {
    type: [PageSectionSchema],
    default: [],
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
PageSchema.index({ slug: 1 }, { unique: true });
PageSchema.index({ template: 1 });
PageSchema.index({ 'sections.type': 1 });
PageSchema.index({ isDeleted: 1 });

// ----------------------------------------------------
// Pre-Validate / Pre-Save Hooks (Slug Generation)
// ----------------------------------------------------
PageSchema.pre('validate', function (this: IPage, next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    this.slug = slugify(this.title);
  }
  next();
});

// ----------------------------------------------------
// Query Middleware (Soft Delete Filter)
// ----------------------------------------------------
PageSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

PageSchema.pre('countDocuments', function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const Page: Model<IPage> = mongoose.models.Page || mongoose.model<IPage>('Page', PageSchema);

export default Page;

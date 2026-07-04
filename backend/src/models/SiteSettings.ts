import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAudit, AuditSchema } from './shared';

export interface ISiteSettings extends Document, IAudit {
  key: string;
  value: Record<string, any>;
}

const SiteSettingsSchema = new Schema<any>({
  key: {
    type: String,
    required: [true, 'Site settings key is required'],
    trim: true,
    lowercase: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: [true, 'Site settings value is required'],
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
SiteSettingsSchema.index({ key: 1 }, { unique: true });
SiteSettingsSchema.index({ isDeleted: 1 });

// ----------------------------------------------------
// Query Middleware (Soft Delete Filter)
// ----------------------------------------------------
SiteSettingsSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

SiteSettingsSchema.pre('countDocuments', function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const SiteSettings: Model<ISiteSettings> = mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);

export default SiteSettings;

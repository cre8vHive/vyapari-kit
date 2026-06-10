import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAudit, AuditSchema } from './shared';

export interface IMedia extends Document, IAudit {
  filename: string;
  mimeType: string;
  fileSize: number; // In bytes
  url: string;
  altText?: string;
}

const MediaSchema = new Schema<any>({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true,
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true,
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative'],
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
  },
  altText: {
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
MediaSchema.index({ mimeType: 1 });
MediaSchema.index({ isDeleted: 1 });
MediaSchema.index({ createdAt: -1 });

// ----------------------------------------------------
// Query Middleware (Soft Delete Filter)
// ----------------------------------------------------
MediaSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

MediaSchema.pre('countDocuments', function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const Media: Model<IMedia> = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;

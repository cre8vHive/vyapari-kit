import mongoose, { Document, Model, Schema } from 'mongoose';
import { AuditSchema, IAudit } from './shared';

export interface ICoursePdf extends Document, IAudit {
  course: mongoose.Types.ObjectId;
  storageType: 'database' | 'external';
  filename: string;
  mimeType: 'application/pdf';
  fileSize?: number;
  sha256?: string;
  data?: Buffer;
  externalUrl?: string;
}

const CoursePdfSchema = new Schema<any>({
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required'],
  },
  storageType: {
    type: String,
    enum: ['database', 'external'],
    required: true,
  },
  filename: {
    type: String,
    required: [true, 'PDF filename is required'],
    trim: true,
  },
  mimeType: {
    type: String,
    enum: ['application/pdf'],
    default: 'application/pdf',
    required: true,
  },
  fileSize: {
    type: Number,
    min: 0,
  },
  sha256: {
    type: String,
    trim: true,
    select: false,
  },
  data: {
    type: Buffer,
    select: false,
  },
  externalUrl: {
    type: String,
    trim: true,
    select: false,
  },
  isDeleted: AuditSchema.path('isDeleted'),
  deletedAt: AuditSchema.path('deletedAt'),
  deletedBy: AuditSchema.path('deletedBy'),
  createdBy: AuditSchema.path('createdBy'),
  updatedBy: AuditSchema.path('updatedBy'),
}, {
  timestamps: true,
});

CoursePdfSchema.index({ course: 1 }, { unique: true });
CoursePdfSchema.index({ isDeleted: 1 });

CoursePdfSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const CoursePdf: Model<ICoursePdf> = mongoose.models.CoursePdf || mongoose.model<ICoursePdf>('CoursePdf', CoursePdfSchema);

export default CoursePdf;

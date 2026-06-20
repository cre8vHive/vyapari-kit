import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPdfAccessLog extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  pageNumber?: number;
  event: 'manifest' | 'stream' | 'page-view';
  ipAddress: string;
  userAgent?: string;
  createdAt: Date;
}

const PdfAccessLogSchema = new Schema<any>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  },
  pageNumber: {
    type: Number,
    min: 1,
  },
  event: {
    type: String,
    enum: ['manifest', 'stream', 'page-view'],
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

PdfAccessLogSchema.index({ user: 1, course: 1, createdAt: -1 });
PdfAccessLogSchema.index({ course: 1, pageNumber: 1, createdAt: -1 });

const PdfAccessLog: Model<IPdfAccessLog> = mongoose.models.PdfAccessLog || mongoose.model<IPdfAccessLog>('PdfAccessLog', PdfAccessLogSchema);

export default PdfAccessLog;

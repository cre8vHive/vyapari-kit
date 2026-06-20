import mongoose, { Document, Model, Schema } from 'mongoose';
import { AuditSchema, IAudit } from './shared';

export interface IEnrollment extends Document, IAudit {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  status: 'active' | 'revoked' | 'refunded';
  enrolledAt: Date;
}

const EnrollmentSchema = new Schema<any>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true,
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required'],
    index: true,
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'refunded'],
    default: 'active',
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
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

EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
EnrollmentSchema.index({ status: 1 });
EnrollmentSchema.index({ isDeleted: 1 });

EnrollmentSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const Enrollment: Model<IEnrollment> = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment;

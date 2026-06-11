import mongoose, { Document, Model, Schema } from 'mongoose';
import { AuditSchema, IAudit } from './shared';

export interface IUser extends Document, IAudit {
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'admin';
  activeSessionId: string | null;
  lastHeartbeat: Date | null;
}

const UserSchema = new Schema<any>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email is invalid'],
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  activeSessionId: {
    type: String,
    default: null,
  },
  lastHeartbeat: {
    type: Date,
    default: null,
  },
  isDeleted: AuditSchema.path('isDeleted'),
  deletedAt: AuditSchema.path('deletedAt'),
  deletedBy: AuditSchema.path('deletedBy'),
  createdBy: AuditSchema.path('createdBy'),
  updatedBy: AuditSchema.path('updatedBy'),
}, {
  timestamps: true,
});

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ isDeleted: 1 });

UserSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

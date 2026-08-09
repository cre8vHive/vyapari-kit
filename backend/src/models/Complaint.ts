import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaint extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isResolved: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);

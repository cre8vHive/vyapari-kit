import mongoose, { Schema } from 'mongoose';

// ----------------------------------------------------
// TypeScript Interfaces
// ----------------------------------------------------

export interface IAudit {
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

export interface ISEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string; // Can be a URL or reference to Media
  noIndex: boolean;
}

// ----------------------------------------------------
// Reusable Mongoose Schemas (Subdocuments)
// ----------------------------------------------------

export const AuditSchema = new Schema<IAudit>({
  isDeleted: {
    type: Boolean,
    default: false,
    required: true,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, { _id: false });

export const SEOSchema = new Schema<ISEO>({
  metaTitle: {
    type: String,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
  },
  metaKeywords: {
    type: [String],
    default: [],
  },
  ogImage: {
    type: String,
    trim: true,
  },
  noIndex: {
    type: Boolean,
    default: false,
    required: true,
  },
}, { _id: false });

// ----------------------------------------------------
// Helper Functions / Slug generator
// ----------------------------------------------------

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')          // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

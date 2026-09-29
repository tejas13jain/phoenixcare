import mongoose from 'mongoose';

const { Schema } = mongoose;

// Singleton document (always looked up/updated via SINGLETON_KEY) so the footer is one
// editable record rather than a collection — matches how a single site-wide footer is used.
export const SINGLETON_KEY = 'footer';

const footerLinkSchema = new Schema(
  { label: { type: String, required: true, trim: true }, url: { type: String, required: true, trim: true } },
  { _id: false }
);

const footerColumnSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    links: { type: [footerLinkSchema], default: [] },
  },
  { _id: false }
);

const trustBadgeSchema = new Schema(
  {
    icon: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const footerSettingsSchema = new Schema(
  {
    key: { type: String, default: SINGLETON_KEY, unique: true, index: true },
    tagline: { type: String, default: 'Rise stronger, every day.' },
    description: { type: String, default: '' },
    trustBadges: { type: [trustBadgeSchema], default: [] },
    columns: { type: [footerColumnSchema], default: [] },
    copyrightText: { type: String, default: 'PhoenixCare. All rights reserved.' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const FooterSettings = mongoose.model('FooterSettings', footerSettingsSchema);

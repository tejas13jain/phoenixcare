import mongoose from 'mongoose';

const { Schema } = mongoose;

const blogPostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, maxlength: 280 },
    content: { type: String, required: true },
    coverImageUrl: { type: String, default: '' },
    category: {
      type: String,
      enum: ['hydration', 'nutrition', 'movement', 'sleep', 'mental_health', 'preventive_care', 'general'],
      default: 'general',
    },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    publishedAt: { type: Date },
    views: { type: Number, default: 0 },
    readTimeMinutes: { type: Number, default: 3 },
  },
  { timestamps: true }
);

blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' });

export const BlogPost = mongoose.model('BlogPost', blogPostSchema);

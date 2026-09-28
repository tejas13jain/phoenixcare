import { BlogPost } from '../models/BlogPost.js';
import { Doctor } from '../models/Doctor.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function generateUniqueSlug(title) {
  const base = slugify(title) || 'post';
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await BlogPost.exists({ slug })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

async function getOwnDoctorOrThrow(req) {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw ApiError.notFound('Doctor profile not found');
  return doctor;
}

export const createBlogPost = catchAsync(async (req, res) => {
  const doctor = await getOwnDoctorOrThrow(req);
  const slug = await generateUniqueSlug(req.validated.body.title);

  const post = await BlogPost.create({
    ...req.validated.body,
    author: doctor._id,
    slug,
  });

  res.status(201).json({ success: true, message: 'Blog post saved as draft', data: { post } });
});

export const updateBlogPost = catchAsync(async (req, res) => {
  const doctor = await getOwnDoctorOrThrow(req);
  const post = await BlogPost.findOne({ _id: req.validated.params.id, author: doctor._id });
  if (!post) throw ApiError.notFound('Blog post not found');

  Object.assign(post, req.validated.body);
  if (req.validated.body.title && req.validated.body.title !== post.title) {
    post.slug = await generateUniqueSlug(req.validated.body.title);
  }
  await post.save();

  res.json({ success: true, message: 'Blog post updated', data: { post } });
});

export const deleteBlogPost = catchAsync(async (req, res) => {
  const doctor = await getOwnDoctorOrThrow(req);
  const post = await BlogPost.findOneAndDelete({ _id: req.validated.params.id, author: doctor._id });
  if (!post) throw ApiError.notFound('Blog post not found');
  res.json({ success: true, message: 'Blog post deleted' });
});

export const setBlogPostStatus = catchAsync(async (req, res) => {
  const doctor = await getOwnDoctorOrThrow(req);
  const post = await BlogPost.findOne({ _id: req.validated.params.id, author: doctor._id });
  if (!post) throw ApiError.notFound('Blog post not found');

  const publish = req.params.action === 'publish';
  post.status = publish ? 'published' : 'draft';
  if (publish && !post.publishedAt) post.publishedAt = new Date();
  await post.save();

  res.json({ success: true, message: publish ? 'Blog post published' : 'Blog post moved back to draft', data: { post } });
});

export const listMyBlogPosts = catchAsync(async (req, res) => {
  const doctor = await getOwnDoctorOrThrow(req);
  const posts = await BlogPost.find({ author: doctor._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { posts } });
});

export const listPublicBlogPosts = catchAsync(async (req, res) => {
  const { q, category, page, limit } = req.validated.query;

  const filter = { status: 'published' };
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };

  const skip = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    BlogPost.find(filter)
      .populate({ path: 'author', populate: { path: 'user', select: 'name avatarUrl' } })
      .sort(q ? { score: { $meta: 'textScore' } } : { publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
  });
});

export const getFeaturedBlogPosts = catchAsync(async (req, res) => {
  const posts = await BlogPost.find({ status: 'published' })
    .populate({ path: 'author', populate: { path: 'user', select: 'name avatarUrl' } })
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean();
  res.json({ success: true, data: { posts } });
});

export const getBlogPostBySlug = catchAsync(async (req, res) => {
  const post = await BlogPost.findOneAndUpdate(
    { slug: req.validated.params.slug, status: 'published' },
    { $inc: { views: 1 } },
    { new: true }
  ).populate({ path: 'author', populate: { path: 'user', select: 'name avatarUrl' } });

  if (!post) throw ApiError.notFound('Blog post not found');

  const related = await BlogPost.find({ status: 'published', category: post.category, _id: { $ne: post._id } })
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean();

  res.json({ success: true, data: { post, related } });
});

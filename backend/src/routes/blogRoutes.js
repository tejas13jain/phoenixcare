import { Router } from 'express';
import * as blogController from '../controllers/blogController.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createBlogSchema, updateBlogSchema, blogIdSchema, blogSlugSchema, listBlogsSchema } from '../validators/blogValidators.js';

const router = Router();

router.get('/', validate(listBlogsSchema), blogController.listPublicBlogPosts);
router.get('/featured', blogController.getFeaturedBlogPosts);
router.get('/mine', requireAuth, requireRole('doctor'), blogController.listMyBlogPosts);
router.get('/slug/:slug', validate(blogSlugSchema), blogController.getBlogPostBySlug);

router.post('/', requireAuth, requireRole('doctor'), validate(createBlogSchema), blogController.createBlogPost);
router.patch('/:id', requireAuth, requireRole('doctor'), validate(updateBlogSchema), blogController.updateBlogPost);
router.delete('/:id', requireAuth, requireRole('doctor'), validate(blogIdSchema), blogController.deleteBlogPost);
router.patch(
  '/:id/:action(publish|unpublish)',
  requireAuth,
  requireRole('doctor'),
  validate(blogIdSchema),
  blogController.setBlogPostStatus
);

export default router;

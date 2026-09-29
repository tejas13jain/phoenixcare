import { z } from 'zod';

const footerLinkSchema = z.object({
  label: z.string().trim().min(1, 'Link label is required').max(60, 'Link label is too long'),
  url: z.string().trim().min(1, 'Link URL is required').max(300, 'Link URL is too long'),
});

const footerColumnSchema = z.object({
  title: z.string().trim().min(1, 'Column title is required').max(60, 'Column title is too long'),
  links: z.array(footerLinkSchema).max(10, 'A column can have at most 10 links'),
});

const trustBadgeSchema = z.object({
  icon: z.string().trim().min(1, 'Icon is required'),
  label: z.string().trim().min(1, 'Badge label is required').max(60, 'Badge label is too long'),
});

export const updateFooterSettingsSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    tagline: z.string().trim().max(120, 'Tagline is too long').optional(),
    description: z.string().trim().max(500, 'Description must be under 500 characters').optional(),
    trustBadges: z.array(trustBadgeSchema).max(6, 'At most 6 trust badges').optional(),
    columns: z.array(footerColumnSchema).max(6, 'At most 6 columns').optional(),
    copyrightText: z.string().trim().max(160, 'Copyright text is too long').optional(),
  }),
});

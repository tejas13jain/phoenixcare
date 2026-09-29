import { FooterSettings, SINGLETON_KEY } from '../models/FooterSettings.js';
import { catchAsync } from '../utils/catchAsync.js';

// Shown until an admin saves a record for the first time, so the public site never renders
// an empty footer. Mirrors the original hardcoded copy from web/src/i18n/locales/en.json.
const DEFAULT_FOOTER = {
  tagline: 'Rise stronger, every day.',
  description:
    'PhoenixCare connects you with verified doctors for video, audio, and chat consultations — with transparent fees and digital prescriptions.',
  trustBadges: [
    { icon: 'ShieldCheck', label: 'Verified doctors' },
    { icon: 'Lock', label: 'Secure payments' },
    { icon: 'Headset', label: '24/7 support' },
  ],
  columns: [
    {
      title: 'For patients',
      links: [
        { label: 'Find doctors', url: '/doctors' },
        { label: 'Book an appointment', url: '/doctors' },
        { label: 'My health report', url: '/patient/health-report' },
      ],
    },
    {
      title: 'For doctors',
      links: [
        { label: 'Join as a doctor', url: '/signup' },
        { label: 'Doctor dashboard', url: '/doctor/dashboard' },
        { label: 'Health Blog', url: '/blog' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help center', url: '/blog' },
        { label: 'Contact us', url: 'mailto:support@phoenixcare.demo' },
        { label: 'Privacy policy', url: '/' },
        { label: 'Terms of service', url: '/' },
      ],
    },
  ],
  copyrightText: 'PhoenixCare. All rights reserved.',
};

export const getFooterSettings = catchAsync(async (req, res) => {
  const settings = await FooterSettings.findOne({ key: SINGLETON_KEY }).lean();
  res.json({ success: true, data: { footer: settings || DEFAULT_FOOTER, isDefault: !settings } });
});

export const updateFooterSettings = catchAsync(async (req, res) => {
  const settings = await FooterSettings.findOneAndUpdate(
    { key: SINGLETON_KEY },
    { ...req.validated.body, key: SINGLETON_KEY, updatedBy: req.user._id },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, message: 'Footer updated', data: { footer: settings } });
});

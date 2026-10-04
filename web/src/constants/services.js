import { Video, FlaskConical, Scale, ShieldPlus, ClipboardCheck } from 'lucide-react';

// Services shown on the home page and at /services/:slug. All copy lives in i18n under
// `services.<i18nKey>`; this file only holds what isn't translated: icon, accent colours,
// and where the call-to-action button leads. A `primary.action` of 'careMatch' opens the
// CareMatch dialog instead of navigating.
export const SERVICES = [
  {
    slug: 'online-consultation',
    i18nKey: 'consultation',
    icon: Video,
    accent: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-100' },
    primary: { to: '/doctors' },
  },
  {
    slug: 'lab-test',
    i18nKey: 'labTest',
    icon: FlaskConical,
    accent: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
    primary: { to: '/doctors?specialty=General%20Physician' },
  },
  {
    slug: 'weight-management',
    i18nKey: 'weightManagement',
    icon: Scale,
    accent: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
    primary: { to: '/doctors?specialty=Nutritionist' },
  },
  {
    slug: 'healthcare-plans',
    i18nKey: 'healthcarePlans',
    icon: ShieldPlus,
    accent: { bg: 'bg-orange-50', text: 'text-orange-500', ring: 'ring-orange-100' },
    primary: { to: '/signup' },
  },
  {
    slug: 'self-diagnostic-tools',
    i18nKey: 'selfDiagnostic',
    icon: ClipboardCheck,
    accent: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-100' },
    primary: { action: 'careMatch' },
  },
];

const BY_SLUG = new Map(SERVICES.map((s) => [s.slug, s]));

export function getService(slug) {
  return BY_SLUG.get(slug);
}

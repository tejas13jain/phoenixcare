import { ShieldCheck, Lock, Headset, Star, Users, HeartPulse, BadgeCheck, Clock, Globe, Sparkles } from 'lucide-react';

// Trust badge icons are stored as plain strings in the FooterSettings record (so the admin
// form can offer a picker without shipping component references through the API) — this
// registry is the single place that maps a stored name back to its lucide-react component.
export const FOOTER_ICONS = {
  ShieldCheck,
  Lock,
  Headset,
  Star,
  Users,
  HeartPulse,
  BadgeCheck,
  Clock,
  Globe,
  Sparkles,
};

export const FOOTER_ICON_NAMES = Object.keys(FOOTER_ICONS);

export function getFooterIcon(name) {
  return FOOTER_ICONS[name] || ShieldCheck;
}

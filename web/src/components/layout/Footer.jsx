import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PhoenixIcon } from '../../assets/logo/PhoenixIcon.jsx';
import { settingsApi } from '../../api/settingsApi.js';
import { getFooterIcon } from '../../constants/footerIcons.js';

// Translated fallback shown instantly (and if the API call fails) so the footer never
// disappears — admin-saved content replaces it once it loads. Admin-authored text is stored
// as plain text (one language), while this fallback stays translated per the active locale.
function buildFallback(t) {
  return {
    tagline: t('footer.tagline'),
    description: t('footer.description'),
    trustBadges: [
      { icon: 'ShieldCheck', label: t('footer.verifiedBadge') },
      { icon: 'Lock', label: t('footer.secureBadge') },
      { icon: 'Headset', label: t('footer.supportBadge') },
    ],
    columns: [
      {
        title: t('footer.forPatients'),
        links: [
          { label: t('footer.findDoctors'), url: '/doctors' },
          { label: t('footer.bookAppointment'), url: '/doctors' },
          { label: t('footer.healthReport'), url: '/patient/health-report' },
        ],
      },
      {
        title: t('footer.forDoctors'),
        links: [
          { label: t('footer.joinAsDoctor'), url: '/signup' },
          { label: t('footer.doctorDashboard'), url: '/doctor/dashboard' },
          { label: t('footer.healthBlog'), url: '/blog' },
        ],
      },
      {
        title: t('footer.support'),
        links: [
          { label: t('footer.helpCenter'), url: '/blog' },
          { label: t('footer.contactUs'), url: 'mailto:support@phoenixcare.demo' },
          { label: t('footer.privacyPolicy'), url: '/' },
          { label: t('footer.termsOfService'), url: '/' },
        ],
      },
    ],
    copyrightText: t('footer.copyright'),
  };
}

export function Footer() {
  const { t } = useTranslation();
  const [footer, setFooter] = useState(() => buildFallback(t));
  const year = new Date().getFullYear();

  useEffect(() => {
    settingsApi
      .getFooter()
      .then((res) => {
        if (!res.data.isDefault) setFooter(res.data.footer);
      })
      .catch(() => {
        // Keep the translated fallback already in state — the footer stays usable offline.
      });
  }, []);

  return (
    <footer className="bg-charcoal text-white/80 mt-auto">
      {footer.trustBadges?.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-3 sm:grid-cols-3 border-b border-white/10">
          {footer.trustBadges.map((badge, i) => (
            <TrustBadge key={i} icon={getFooterIcon(badge.icon)} label={badge.label} />
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <PhoenixIcon size={28} />
            <span className="font-heading font-bold text-lg text-white">
              Phoenix<span className="text-teal-400">Care</span>
            </span>
          </div>
          {footer.tagline && <p className="mt-2 text-sm font-medium text-white/90">{footer.tagline}</p>}
          {footer.description && (
            <p className="mt-3 text-sm text-white/60 max-w-sm leading-relaxed">{footer.description}</p>
          )}
        </div>

        {footer.columns?.map((column, i) => (
          <FooterColumn key={i} title={column.title}>
            {column.links.map((link, j) => (
              <FooterLink key={j} to={link.url}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 border-t border-white/10 text-xs text-white/50">
        © {year} {footer.copyrightText}
      </div>
    </footer>
  );
}

function TrustBadge({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-white/80">
      <span className="rounded-full bg-white/10 p-2">
        <Icon size={16} />
      </span>
      {label}
    </div>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div>
      <h4 className="font-heading font-semibold text-white text-sm mb-3">{title}</h4>
      <div className="flex flex-col gap-2 text-sm">{children}</div>
    </div>
  );
}

function FooterLink({ to, children }) {
  const className = 'text-white/60 hover:text-white transition-colors';
  if (to.startsWith('mailto:') || /^https?:\/\//.test(to)) {
    return (
      <a href={to} className={className} target={to.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

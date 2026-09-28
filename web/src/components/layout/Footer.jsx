import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, Headset } from 'lucide-react';
import { PhoenixIcon } from '../../assets/logo/PhoenixIcon.jsx';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-white/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-3 sm:grid-cols-3 border-b border-white/10">
        <TrustBadge icon={ShieldCheck} label={t('footer.verifiedBadge')} />
        <TrustBadge icon={Lock} label={t('footer.secureBadge')} />
        <TrustBadge icon={Headset} label={t('footer.supportBadge')} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <PhoenixIcon size={28} />
            <span className="font-heading font-bold text-lg text-white">
              Phoenix<span className="text-teal-400">Care</span>
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-white/90">{t('footer.tagline')}</p>
          <p className="mt-3 text-sm text-white/60 max-w-sm leading-relaxed">{t('footer.description')}</p>
        </div>

        <FooterColumn title={t('footer.forPatients')}>
          <FooterLink to="/doctors">{t('footer.findDoctors')}</FooterLink>
          <FooterLink to="/doctors">{t('footer.bookAppointment')}</FooterLink>
          <FooterLink to="/patient/health-report">{t('footer.healthReport')}</FooterLink>
        </FooterColumn>

        <FooterColumn title={t('footer.forDoctors')}>
          <FooterLink to="/signup">{t('footer.joinAsDoctor')}</FooterLink>
          <FooterLink to="/doctor/dashboard">{t('footer.doctorDashboard')}</FooterLink>
          <FooterLink to="/blog">{t('footer.healthBlog')}</FooterLink>
        </FooterColumn>

        <FooterColumn title={t('footer.support')}>
          <FooterLink to="/blog">{t('footer.helpCenter')}</FooterLink>
          <FooterLink to="mailto:support@phoenixcare.demo">{t('footer.contactUs')}</FooterLink>
          <FooterLink to="/">{t('footer.privacyPolicy')}</FooterLink>
          <FooterLink to="/">{t('footer.termsOfService')}</FooterLink>
        </FooterColumn>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 border-t border-white/10 text-xs text-white/50">
        © {year} {t('footer.copyright')}
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
  if (to.startsWith('mailto:')) {
    return (
      <a href={to} className={className}>
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

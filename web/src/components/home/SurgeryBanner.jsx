import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Hospital } from 'lucide-react';
import { POPULAR_PROCEDURES } from '../../constants/surgery.js';

export function SurgeryBanner() {
  const { t } = useTranslation();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-sky-600 to-teal-600 p-7 sm:p-10 text-white shadow-soft-lg"
      >
        <Hospital aria-hidden size={180} className="absolute -right-6 -bottom-8 text-white/10" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/75">{t('home.surgeryBannerEyebrow')}</p>
          <h2 className="mt-2 font-heading font-bold text-2xl sm:text-3xl leading-snug">{t('home.surgeryBannerTitle')}</h2>
          <p className="mt-2 text-white/85">{t('home.surgeryBannerText')}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {POPULAR_PROCEDURES.slice(0, 6).map((key) => (
              <span key={key} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                {t(`surgery.procedures.${key}`)}
              </span>
            ))}
          </div>
          <Link
            to="/surgery"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-heading font-semibold text-cyan-700 hover:bg-cyan-50"
          >
            {t('home.surgeryBannerButton')} <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

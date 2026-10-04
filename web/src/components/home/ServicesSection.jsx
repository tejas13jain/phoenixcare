import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Stethoscope } from 'lucide-react';
import { SERVICES } from '../../constants/services.js';

export function ServiceCard({ service, index = 0 }) {
  const { t } = useTranslation();
  const base = `services.${service.i18nKey}`;
  const points = t(`${base}.points`, { returnObjects: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group h-full"
    >
      <Link
        to={`/services/${service.slug}`}
        className="flex h-full flex-col rounded-2xl border border-slate-600/10 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-cyan-200 hover:shadow-soft-lg"
      >
        <span className={`w-fit rounded-2xl p-3 ring-4 ${service.accent.bg} ${service.accent.text} ${service.accent.ring}`}>
          <service.icon size={26} />
        </span>
        <h3 className="mt-5 font-heading font-bold text-lg text-charcoal leading-snug">{t(`${base}.title`)}</h3>
        <p className="text-sm text-slate-600">{t(`${base}.subtitle`)}</p>

        <ul className="mt-4 space-y-2 flex-1">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-charcoal">
              <CheckCircle2 size={16} className="text-cyan-600 shrink-0 mt-0.5" />
              {point}
            </li>
          ))}
        </ul>

        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600">
          {t('services.learnMore')}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    </motion.div>
  );
}

export function ServicesSection({ onOpenCareMatch }) {
  const { t } = useTranslation();

  return (
    <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">{t('services.sectionEyebrow')}</p>
        <h2 className="mt-2 font-heading font-bold text-3xl text-charcoal">{t('services.sectionTitle')}</h2>
        <p className="mt-3 text-slate-600">{t('services.sectionSubtitle')}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, i) => (
          <ServiceCard key={service.slug} service={service} index={i} />
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: SERVICES.length * 0.06 }}
          className="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 p-6 text-white shadow-soft"
        >
          <span className="w-fit rounded-2xl bg-white/15 p-3">
            <Stethoscope size={26} />
          </span>
          <h3 className="mt-5 font-heading font-bold text-lg">{t('services.helpCardTitle')}</h3>
          <p className="mt-1 text-sm text-white/85">{t('services.helpCardText')}</p>
          <button
            onClick={onOpenCareMatch}
            className="mt-5 w-fit inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 hover:bg-cyan-50"
          >
            {t('home.careMatchButton')} <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

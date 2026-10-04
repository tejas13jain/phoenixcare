import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  FileText,
  FolderLock,
  HeartHandshake,
  Languages,
  MonitorSmartphone,
  SearchCheck,
  Wallet,
  X,
} from 'lucide-react';
import { PhoenixIcon } from '../../assets/logo/PhoenixIcon.jsx';

// Same order as `why.reasons` in the locale files.
const REASON_ICONS = [BadgeCheck, MonitorSmartphone, FileText, FolderLock, Wallet, HeartHandshake, SearchCheck, Languages];

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.4, delay: i * 0.05 },
});

export function WhyPhoenixCare() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reasons = t('why.reasons', { returnObjects: true });
  const steps = t('why.steps', { returnObjects: true });
  const promisePoints = t('why.promisePoints', { returnObjects: true });
  const compareRows = t('why.compareRows', { returnObjects: true });

  return (
    <section className="bg-gradient-to-b from-white via-cyan-50/60 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">{t('why.eyebrow')}</p>
          <h2 className="mt-2 font-heading font-bold text-3xl text-charcoal">{t('why.title')}</h2>
          <p className="mt-3 text-slate-600">{t('why.subtitle')}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <motion.div
            {...fadeUp()}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-sky-600 to-teal-600 p-7 text-white shadow-soft-lg lg:sticky lg:top-24 lg:self-start"
          >
            <PhoenixIcon size={176} className="absolute -right-8 -bottom-8 opacity-15" />
            <p className="text-xs font-semibold uppercase tracking-widest text-white/75">{t('why.promiseTitle')}</p>
            <p className="mt-3 font-heading text-xl font-semibold leading-snug">{t('why.promiseText')}</p>
            <ul className="mt-6 space-y-3">
              {promisePoints.map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-sm">
                  <span className="rounded-full bg-white/20 p-1">
                    <Check size={14} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/doctors')}
              className="relative mt-7 inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-cyan-700 hover:bg-cyan-50"
            >
              {t('why.ctaButton')} <ArrowRight size={16} />
            </button>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reasons.map((reason, i) => {
              const Icon = REASON_ICONS[i] ?? BadgeCheck;
              return (
                <motion.div
                  key={reason.title}
                  {...fadeUp(i)}
                  className="rounded-2xl border border-slate-600/10 bg-white p-5 shadow-soft"
                >
                  <span className="inline-flex rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-3 font-heading font-semibold text-charcoal">{reason.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{reason.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-center font-heading font-bold text-2xl text-charcoal mb-8">{t('why.howTitle')}</h3>
          <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <span
              aria-hidden
              className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-cyan-200 via-cyan-400 to-orange-300"
            />
            {steps.map((step, i) => (
              <motion.li key={step.title} {...fadeUp(i)} className="relative text-center">
                <span className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white font-heading text-lg font-bold text-cyan-600 ring-4 ring-cyan-100 shadow-soft">
                  {i + 1}
                </span>
                <p className="mt-3 font-heading font-semibold text-charcoal">{step.title}</p>
                <p className="mt-1 text-sm text-slate-600">{step.desc}</p>
              </motion.li>
            ))}
          </ol>
        </div>

        <motion.div {...fadeUp()} className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-center font-heading font-bold text-2xl text-charcoal mb-6">{t('why.compareTitle')}</h3>
          <div className="overflow-hidden rounded-2xl border border-slate-600/10 bg-white shadow-soft">
            <div className="grid grid-cols-[1.1fr_1fr_1fr] bg-offwhite text-xs font-semibold uppercase tracking-wide text-slate-600">
              <span className="p-3 sm:p-4" />
              <span className="p-3 sm:p-4 bg-cyan-50 text-cyan-700">{t('why.compareUs')}</span>
              <span className="p-3 sm:p-4">{t('why.compareThem')}</span>
            </div>
            {compareRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.1fr_1fr_1fr] border-t border-slate-600/10 text-xs sm:text-sm"
              >
                <span className="p-3 sm:p-4 font-medium text-charcoal">{row.label}</span>
                <span className="p-3 sm:p-4 bg-cyan-50/50 text-charcoal flex items-start gap-1.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  {row.us}
                </span>
                <span className="p-3 sm:p-4 text-slate-600 flex items-start gap-1.5">
                  <X size={16} className="text-slate-600/50 shrink-0 mt-0.5" />
                  {row.them}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

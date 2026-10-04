import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, UserRound } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Button } from '../components/ui/index.js';
import { ServiceCard } from '../components/home/ServicesSection.jsx';
import { CareMatchModal } from '../components/home/CareMatchModal.jsx';
import { SERVICES, getService } from '../constants/services.js';

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.35, delay: i * 0.05 },
});

export function ServiceDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [careMatchOpen, setCareMatchOpen] = useState(false);
  const service = getService(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!service) {
    return (
      <PageTransition>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <p className="text-slate-600 mb-6">{t('services.notFound')}</p>
          <Link to="/#services">
            <Button>{t('services.backToServices')}</Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  const base = `services.${service.i18nKey}`;
  const points = t(`${base}.points`, { returnObjects: true });
  const features = t(`${base}.features`, { returnObjects: true });
  const steps = t(`${base}.steps`, { returnObjects: true });
  const idealFor = t(`${base}.idealFor`, { returnObjects: true });
  const faqs = t(`${base}.faqs`, { returnObjects: true });
  const otherServices = SERVICES.filter((s) => s.slug !== service.slug);

  const handleCta = () => {
    if (service.primary.action === 'careMatch') setCareMatchOpen(true);
    else navigate(service.primary.to);
  };

  const ctaButton = (
    <button
      onClick={handleCta}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-heading font-semibold text-white shadow-soft hover:bg-orange-600 transition-colors"
    >
      {t(`${base}.cta`)} <ArrowRight size={18} />
    </button>
  );

  return (
    <PageTransition>
      <section className="bg-gradient-to-br from-cyan-50 via-sky-50 to-cyan-100/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Link
            to="/#services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:underline"
          >
            <ArrowLeft size={16} /> {t('services.backToServices')}
          </Link>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-start gap-5">
            <span
              className={`w-fit rounded-2xl p-4 ring-4 bg-white ${service.accent.text} ${service.accent.ring}`}
            >
              <service.icon size={36} />
            </span>
            <div className="flex-1">
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-charcoal leading-tight">
                {t(`${base}.title`)}
              </h1>
              <p className="mt-1 text-lg text-slate-600">{t(`${base}.subtitle`)}</p>
              <p className="mt-4 text-charcoal leading-relaxed max-w-3xl">{t(`${base}.overview`)}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {points.map((point) => (
                  <span
                    key={point}
                    className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-white px-3 py-1 text-sm text-cyan-700"
                  >
                    <CheckCircle2 size={14} /> {point}
                  </span>
                ))}
              </div>

              <div className="mt-7">{ctaButton}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="font-heading font-bold text-2xl text-charcoal mb-6">{t('services.included')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              {...fadeUp(i)}
              className="rounded-2xl border border-slate-600/10 bg-white p-5 shadow-soft"
            >
              <div className="flex items-start gap-3">
                <span className={`rounded-xl p-2 ${service.accent.bg} ${service.accent.text}`}>
                  <CheckCircle2 size={18} />
                </span>
                <div>
                  <h3 className="font-heading font-semibold text-charcoal">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-slate-600/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="font-heading font-bold text-2xl text-charcoal mb-8">{t('services.howItWorks')}</h2>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.li key={step.title} {...fadeUp(i)} className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 font-heading font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-3 font-heading font-semibold text-charcoal">{step.title}</p>
                <p className="mt-1 text-sm text-slate-600">{step.desc}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-heading font-bold text-2xl text-charcoal mb-5">{t('services.idealFor')}</h2>
          <ul className="space-y-3">
            {idealFor.map((item) => (
              <li key={item} className="flex items-start gap-3 text-charcoal">
                <span className="rounded-full bg-cyan-50 p-1.5 text-cyan-600 shrink-0">
                  <UserRound size={14} />
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-heading font-bold text-2xl text-charcoal mb-5">{t('services.faqTitle')}</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-slate-600/10 bg-white p-4 shadow-soft open:border-cyan-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-charcoal [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown size={18} className="shrink-0 text-slate-600 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border-2 border-cyan-400 bg-white p-6">
          <div>
            <p className="font-heading font-bold text-lg text-charcoal">{t(`${base}.title`)}</p>
            <p className="text-sm text-slate-600">{t(`${base}.subtitle`)}</p>
          </div>
          {ctaButton}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="font-heading font-bold text-2xl text-charcoal mb-6">{t('services.otherServices')}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {otherServices.map((s, i) => (
            <ServiceCard key={s.slug} service={s} index={i} />
          ))}
        </div>
      </section>

      <CareMatchModal isOpen={careMatchOpen} onClose={() => setCareMatchOpen(false)} />
    </PageTransition>
  );
}

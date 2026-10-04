import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronDown,
  FileText,
  HeartHandshake,
  PhoneCall,
  ShieldCheck,
  UserCheck,
  Video,
} from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Button, Input, Modal } from '../components/ui/index.js';
import { surgeryApi } from '../api/surgeryApi.js';
import { extractErrorMessage } from '../api/client.js';
import { useAuthStore } from '../store/slices/authStore.js';
import { SURGERY_SPECIALTIES, POPULAR_PROCEDURES, PROCEDURE_NOT_SURE } from '../constants/surgery.js';

// Same order as `surgery.why` in the locale files.
const WHY_ICONS = [UserCheck, Calculator, ShieldCheck, Video, FileText, HeartHandshake];

// Matches the backend validator: optional +, then 8–15 digits once spaces/dashes are removed.
const PHONE_PATTERN = /^\+?\d{8,15}$/;

const ICON_BY_PROCEDURE = new Map(
  SURGERY_SPECIALTIES.flatMap((s) => s.procedures.map((p) => [p, s.icon]))
);

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.35, delay: i * 0.05 },
});

const SELECT_CLASS =
  'w-full rounded-xl border px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500';

export function SurgeryCarePage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    procedure: '',
    city: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState(null);
  const formRef = useRef(null);
  const nameRef = useRef(null);

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const pickProcedure = (key) => {
    setForm((f) => ({ ...f, procedure: key }));
    setErrors((errs) => ({ ...errs, procedure: undefined }));
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nameRef.current?.focus({ preventScroll: true });
  };

  const validateForm = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = t('surgery.form.errors.name');
    if (!PHONE_PATTERN.test(form.phone.replace(/[\s-]/g, ''))) next.phone = t('surgery.form.errors.phone');
    if (!form.procedure) next.procedure = t('surgery.form.errors.procedure');
    if (form.city.trim().length < 2) next.city = t('surgery.form.errors.city');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Save the English label so the care team reads every request in one language.
    const procedureLabel =
      form.procedure === PROCEDURE_NOT_SURE
        ? i18n.t('surgery.form.notSure', { lng: 'en' })
        : i18n.t(`surgery.procedures.${form.procedure}`, { lng: 'en' });

    setSubmitting(true);
    try {
      await surgeryApi.createEnquiry({
        name: form.name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        procedure: procedureLabel,
        ...(form.notes.trim() && { notes: form.notes.trim() }),
      });
      setSubmittedName(form.name.trim().split(' ')[0]);
      setForm((f) => ({ ...f, procedure: '', city: '', notes: '' }));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const highlights = t('surgery.highlights', { returnObjects: true });
  const whyItems = t('surgery.why', { returnObjects: true });
  const steps = t('surgery.steps', { returnObjects: true });
  const faqs = t('surgery.faqs', { returnObjects: true });
  const successSteps = t('surgery.success.steps', { returnObjects: true });

  return (
    <PageTransition>
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-sky-50 to-cyan-100/70">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">{t('surgery.eyebrow')}</p>
            <h1 className="mt-3 font-heading font-extrabold text-3xl sm:text-5xl leading-tight text-charcoal">
              {t('surgery.heroTitle')}
            </h1>
            <p className="mt-4 text-slate-600 text-base sm:text-lg max-w-xl">{t('surgery.heroSubtitle')}</p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2 max-w-xl">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-2.5 rounded-xl bg-white/80 px-3.5 py-2.5 text-sm text-charcoal shadow-soft">
                  <CheckCircle2 size={18} className="text-cyan-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <motion.form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-3xl border-2 border-cyan-400 bg-white p-6 sm:p-7 shadow-soft-lg space-y-4"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-full bg-cyan-50 p-2.5 text-cyan-600 shrink-0">
                <PhoneCall size={20} />
              </span>
              <div>
                <h2 className="font-heading font-bold text-xl text-charcoal">{t('surgery.form.title')}</h2>
                <p className="text-sm text-slate-600">{t('surgery.form.subtitle')}</p>
              </div>
            </div>

            <Input
              ref={nameRef}
              name="name"
              label={t('surgery.form.name')}
              placeholder={t('surgery.form.namePlaceholder')}
              value={form.name}
              onChange={setField('name')}
              error={errors.name}
              autoComplete="name"
            />
            <Input
              name="phone"
              type="tel"
              label={t('surgery.form.phone')}
              placeholder={t('surgery.form.phonePlaceholder')}
              value={form.phone}
              onChange={setField('phone')}
              error={errors.phone}
              autoComplete="tel"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="procedure" className="block mb-1.5 text-sm font-medium text-charcoal">
                  {t('surgery.form.procedure')}
                </label>
                <select
                  id="procedure"
                  value={form.procedure}
                  onChange={setField('procedure')}
                  aria-invalid={!!errors.procedure}
                  className={`${SELECT_CLASS} ${errors.procedure ? 'border-error' : 'border-slate-600/20'} ${
                    form.procedure ? 'text-charcoal' : 'text-slate-600/70'
                  }`}
                >
                  <option value="" disabled>
                    {t('surgery.form.procedurePlaceholder')}
                  </option>
                  {SURGERY_SPECIALTIES.map((s) => (
                    <optgroup key={s.key} label={t(`surgery.specialties.${s.key}`)}>
                      {s.procedures.map((p) => (
                        <option key={p} value={p}>
                          {t(`surgery.procedures.${p}`)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value={PROCEDURE_NOT_SURE}>{t('surgery.form.notSure')}</option>
                </select>
                {errors.procedure && <p className="mt-1 text-xs text-error">{errors.procedure}</p>}
              </div>
              <Input
                name="city"
                label={t('surgery.form.city')}
                placeholder={t('surgery.form.cityPlaceholder')}
                value={form.city}
                onChange={setField('city')}
                error={errors.city}
                autoComplete="address-level2"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block mb-1.5 text-sm font-medium text-charcoal">
                {t('surgery.form.notes')}
              </label>
              <textarea
                id="notes"
                rows={2}
                maxLength={500}
                value={form.notes}
                onChange={setField('notes')}
                placeholder={t('surgery.form.notesPlaceholder')}
                className={`${SELECT_CLASS} border-slate-600/20 resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3.5 font-heading text-base font-semibold text-white shadow-soft hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {submitting && (
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden />
              )}
              {t('surgery.form.submit')} <ArrowRight size={18} />
            </button>
            <p className="text-xs text-slate-600">{t('surgery.form.consent')}</p>
          </motion.form>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h2 className="font-heading font-bold text-3xl text-charcoal">{t('surgery.whyTitle')}</h2>
          <p className="mt-3 text-slate-600">{t('surgery.whySubtitle')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyItems.map((item, i) => {
            const Icon = WHY_ICONS[i] ?? ShieldCheck;
            return (
              <motion.div key={item.title} {...fadeUp(i)} className="rounded-2xl border border-slate-600/10 bg-white p-6 shadow-soft">
                <span className="inline-flex rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 font-heading font-semibold text-charcoal">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="bg-white border-y border-slate-600/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="font-heading font-bold text-2xl text-charcoal">{t('surgery.popularTitle')}</h2>
          <p className="mt-1 mb-6 text-sm text-slate-600">{t('surgery.popularSubtitle')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {POPULAR_PROCEDURES.map((key, i) => {
              const Icon = ICON_BY_PROCEDURE.get(key);
              return (
                <motion.button
                  key={key}
                  {...fadeUp(i)}
                  onClick={() => pickProcedure(key)}
                  className="group flex items-center justify-between gap-2 rounded-2xl border border-slate-600/10 bg-offwhite px-4 py-4 text-left hover:border-cyan-300 hover:bg-cyan-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded-full bg-white p-2 text-cyan-600 shadow-soft">
                      <Icon size={18} />
                    </span>
                    <span className="text-sm font-semibold text-charcoal">{t(`surgery.procedures.${key}`)}</span>
                  </span>
                  <ArrowRight size={16} className="text-cyan-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-heading font-bold text-2xl text-charcoal">{t('surgery.specialtiesTitle')}</h2>
        <p className="mt-1 mb-6 text-sm text-slate-600">{t('surgery.specialtiesSubtitle')}</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SURGERY_SPECIALTIES.map((s, i) => (
            <motion.div key={s.key} {...fadeUp(i)} className="rounded-2xl border border-slate-600/10 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
                  <s.icon size={20} />
                </span>
                <h3 className="font-heading font-semibold text-charcoal">{t(`surgery.specialties.${s.key}`)}</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.procedures.map((p) => (
                  <button
                    key={p}
                    onClick={() => pickProcedure(p)}
                    className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs text-cyan-700 hover:bg-cyan-50"
                  >
                    {t(`surgery.procedures.${p}`)}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-white via-cyan-50/60 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-center font-heading font-bold text-2xl text-charcoal mb-8">{t('surgery.howTitle')}</h2>
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
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-center font-heading font-bold text-2xl text-charcoal mb-6">{t('surgery.faqTitle')}</h2>
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
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-3xl bg-gradient-to-br from-cyan-600 via-sky-600 to-teal-600 p-7 sm:p-9 text-white shadow-soft-lg">
          <div>
            <h3 className="font-heading font-bold text-2xl">{t('surgery.ctaTitle')}</h3>
            <p className="mt-1 text-white/85">{t('surgery.ctaText')}</p>
          </div>
          <button
            onClick={() => {
              formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              nameRef.current?.focus({ preventScroll: true });
            }}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-heading font-semibold text-cyan-700 hover:bg-cyan-50"
          >
            {t('surgery.ctaButton')} <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <Modal isOpen={!!submittedName} onClose={() => setSubmittedName(null)} title={t('surgery.success.title')}>
        <div className="flex justify-center mb-4">
          <span className="rounded-full bg-emerald-50 p-4 text-emerald-600">
            <CheckCircle2 size={36} />
          </span>
        </div>
        <p className="text-sm text-charcoal mb-4">{t('surgery.success.text', { name: submittedName })}</p>
        <ol className="space-y-3 mb-6">
          {successSteps.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm text-charcoal">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <Button className="w-full" onClick={() => setSubmittedName(null)}>
          {t('surgery.success.button')}
        </Button>
      </Modal>
    </PageTransition>
  );
}

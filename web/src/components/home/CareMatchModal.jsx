import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, RotateCcw, Search, Sparkles } from 'lucide-react';
import { Modal } from '../ui/index.js';
import { SPECIALTIES, getSpecialtyInfo, matchSpecialties } from '../../constants/specialties.js';
import { openAssistant } from '../assistant/AssistantWidget.jsx';

const FALLBACK = getSpecialtyInfo('General Physician');

// "Help Me Choose": turns a plain-language description (or a tapped concern) into a
// recommended specialty, then sends the patient to the filtered doctor list.
export function CareMatchModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  const reset = () => {
    setText('');
    setResult(null);
  };

  const close = () => {
    onClose();
    reset();
  };

  const submitText = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const matches = matchSpecialties(text);
    setResult(
      matches.length
        ? { primary: matches[0], others: matches.slice(1, 3), matched: true }
        : { primary: FALLBACK, others: [], matched: false }
    );
  };

  const goTo = (specialty) => {
    close();
    navigate(`/doctors?specialty=${encodeURIComponent(specialty.name)}`);
  };

  const label = (s) => t(`specialty.${s.i18nKey}.label`);

  return (
    <Modal isOpen={isOpen} onClose={close} title={t('careMatch.title')} className="!max-w-2xl max-h-[90vh] overflow-y-auto">
      {!result ? (
        <>
          <p className="text-sm text-slate-600 mb-4">{t('careMatch.intro')}</p>

          <form onSubmit={submitText} className="mb-5">
            <label htmlFor="carematch-input" className="block text-sm font-semibold text-charcoal mb-1.5">
              {t('careMatch.inputLabel')}
            </label>
            <div className="flex gap-2">
              <input
                id="carematch-input"
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('careMatch.inputPlaceholder')}
                className="flex-1 min-w-0 rounded-xl border border-slate-600/20 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                aria-label={t('home.searchButton')}
                className="shrink-0 rounded-xl bg-cyan-600 px-4 text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                <Search size={18} />
              </button>
            </div>
          </form>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">{t('careMatch.orPick')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SPECIALTIES.map((s) => (
              <button
                key={s.name}
                onClick={() => setResult({ primary: s, others: [], matched: true })}
                className="flex items-center gap-3 rounded-xl border border-slate-600/10 bg-white p-3 text-left hover:border-cyan-300 hover:bg-cyan-50/60 transition-colors"
              >
                <span className="rounded-full bg-cyan-50 p-2 text-cyan-600 shrink-0">
                  <s.icon size={18} />
                </span>
                <span className="text-sm text-charcoal">{t(`specialty.${s.i18nKey}.tagline`)}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {!result.matched && <p className="text-sm text-slate-600 mb-4">{t('careMatch.noMatch')}</p>}

          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600 mb-2">
            {t('careMatch.recommended')}
          </p>
          <div className="rounded-2xl border-2 border-cyan-200 bg-cyan-50/50 p-5">
            <div className="flex items-start gap-4">
              <span className="rounded-full bg-white p-3 text-cyan-600 shadow-soft shrink-0">
                <result.primary.icon size={24} />
              </span>
              <div className="flex-1">
                <p className="font-heading font-bold text-lg text-charcoal">{label(result.primary)}</p>
                <p className="text-sm text-slate-600">{t(`specialty.${result.primary.i18nKey}.tagline`)}</p>
              </div>
            </div>
            <button
              onClick={() => goTo(result.primary)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-heading font-semibold text-white hover:bg-cyan-700"
            >
              {t('careMatch.seeDoctors', { specialty: label(result.primary) })} <ArrowRight size={16} />
            </button>
          </div>

          <button
            onClick={() => {
              const specialty = label(result.primary);
              close();
              openAssistant(t('assistant.askFromCareMatchMessage', { specialty }));
            }}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-cyan-600 px-5 py-2.5 font-heading text-sm font-semibold text-cyan-700 hover:bg-cyan-50"
          >
            <Sparkles size={16} /> {t('assistant.askFromCareMatch', { specialty: label(result.primary) })}
          </button>

          {result.others.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                {t('careMatch.alsoConsider')}
              </p>
              <div className="flex flex-wrap gap-2">
                {result.others.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => goTo(s)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-sm text-cyan-700 hover:bg-cyan-50"
                  >
                    <s.icon size={14} /> {label(s)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={reset}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-charcoal"
          >
            <RotateCcw size={14} /> {t('careMatch.startOver')}
          </button>
        </motion.div>
      )}

      <div className="mt-6 flex gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
        <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
        <p>{t('careMatch.emergency')}</p>
      </div>
    </Modal>
  );
}

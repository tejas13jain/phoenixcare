import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../i18n/index.js';

export function LanguageSwitcher({ variant = 'desktop' }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const choose = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => choose(lang.code)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border ${
              lang.code === current.code
                ? 'bg-teal-600 text-white border-teal-600'
                : 'text-slate-600 border-slate-600/20'
            }`}
          >
            {lang.nativeLabel}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-600/10"
      >
        <Globe size={16} /> {current.nativeLabel}
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-40 rounded-xl bg-white shadow-soft-lg border border-slate-600/10 py-1.5 z-50"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={lang.code === current.code}
              onClick={() => choose(lang.code)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-charcoal hover:bg-slate-600/5"
            >
              <span>
                {lang.nativeLabel} <span className="text-slate-600">· {lang.label}</span>
              </span>
              {lang.code === current.code && <Check size={14} className="text-teal-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

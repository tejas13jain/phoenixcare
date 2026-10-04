import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { assistantApi } from '../../api/assistantApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { useAuthStore } from '../../store/slices/authStore.js';
import { Caution, Card, Emergency } from './AssistantCards.jsx';

export const OPEN_ASSISTANT_EVENT = 'phoenix:open-assistant';
const NOTICE_KEY = 'phoenixcare_ai_notice_ok';
const MAX_SENT = 12;

// Pages where the floating assistant would get in the way (payments, video calls, admin tools).
const HIDDEN_ON = [/^\/admin/, /^\/consultation\//, /^\/book\//, /^\/login/, /^\/signup/, /^\/otp-login/, /^\/doctor\//];

// Lets any page open the assistant, optionally with a first message:
//   window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT, { detail: { message: '...' } }))
export function openAssistant(message) {
  window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT, { detail: { message } }));
}

const readNotice = () => {
  try {
    return localStorage.getItem(NOTICE_KEY) === '1';
  } catch {
    return false;
  }
};
const writeNotice = () => {
  try {
    localStorage.setItem(NOTICE_KEY, '1');
  } catch {
    /* private mode — the notice simply shows again next time */
  }
};

export function AssistantWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role = useAuthStore((s) => s.user?.role);

  const [open, setOpen] = useState(false);
  const [noticeOk, setNoticeOk] = useState(readNotice);
  const [messages, setMessages] = useState([]); // { role, content, cards?, safety?, mode?, degraded?, suggestions? }
  const [lastShown, setLastShown] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const pendingRef = useRef(null);

  // Conversations live in memory only: health-related chats are never written to browser storage.
  const send = useCallback(
    async (text) => {
      const content = text.trim();
      if (!content || loading) return;
      const next = [...messages, { role: 'user', content }];
      setMessages(next);
      setInput('');
      setLoading(true);
      try {
        const res = await assistantApi.chat({
          messages: next.slice(-MAX_SENT).map(({ role, content: c }) => ({ role, content: c })),
          lastShown: lastShown.slice(0, 6),
        });
        const d = res.data;
        setLastShown(d.shown.map((s) => s.id));
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: d.reply, cards: d.cards, safety: d.safety, mode: d.mode, degraded: d.mode === 'guided' && d.degradedReason !== 'ai_not_configured', suggestions: d.suggestions },
        ]);
      } catch (err) {
        const message = err?.response?.status === 429 ? extractErrorMessage(err) : t('assistant.error');
        setMessages((m) => [...m, { role: 'assistant', content: message, error: true }]);
      } finally {
        setLoading(false);
      }
    },
    [messages, lastShown, loading, t]
  );

  // Open from anywhere (e.g. "Let AI pick the best doctor" in CareMatch).
  useEffect(() => {
    const handler = (e) => {
      setOpen(true);
      if (e.detail?.message) pendingRef.current = e.detail.message;
    };
    window.addEventListener(OPEN_ASSISTANT_EVENT, handler);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, handler);
  }, []);

  useEffect(() => {
    if (open && noticeOk && pendingRef.current) {
      const message = pendingRef.current;
      pendingRef.current = null;
      send(message);
    }
  }, [open, noticeOk, send]);

  useEffect(() => {
    if (!open || aiEnabled !== null) return;
    assistantApi
      .status()
      .then((res) => setAiEnabled(res.data.aiEnabled))
      .catch(() => setAiEnabled(true));
  }, [open, aiEnabled]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open && noticeOk) inputRef.current?.focus();
  }, [open, noticeOk]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (role === 'doctor' || role === 'admin' || HIDDEN_ON.some((re) => re.test(pathname))) return null;

  const acceptNotice = () => {
    writeNotice();
    setNoticeOk(true);
  };
  const reset = () => {
    setMessages([]);
    setLastShown([]);
  };
  const starters = t('assistant.starters', { returnObjects: true });
  const introPoints = t('assistant.intro.points', { returnObjects: true });
  const guidedHeader = aiEnabled === false;
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <>
      {!open && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setOpen(true)}
          aria-label={t('assistant.launcherAria')}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-3 font-heading text-sm font-semibold text-white shadow-soft-lg hover:brightness-110 sm:bottom-6 sm:right-6"
        >
          <Sparkles size={18} /> <span>{t('assistant.launcher')}</span>
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label={t('assistant.title')}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[640px] sm:max-h-[calc(100vh-3rem)] sm:w-[400px] sm:rounded-3xl sm:border sm:border-slate-600/10 sm:shadow-soft-lg"
          >
            <header className="flex items-center gap-3 bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-3 text-white sm:rounded-t-3xl">
              <span className="rounded-full bg-white/20 p-2">
                <Sparkles size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold leading-tight">{t('assistant.title')}</p>
                <p className="text-xs text-white/80">{guidedHeader ? t('assistant.guidedMode') : t('assistant.badgeAi')}</p>
              </div>
              {messages.length > 0 && (
                <button onClick={reset} aria-label={t('assistant.newChat')} title={t('assistant.newChat')} className="rounded-full p-2 hover:bg-white/15">
                  <RotateCcw size={16} />
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label={t('assistant.close')} className="rounded-full p-2 hover:bg-white/15">
                <X size={18} />
              </button>
            </header>

            {!noticeOk ? (
              <div className="flex-1 overflow-y-auto p-5">
                <h2 className="font-heading text-lg font-bold text-charcoal">{t('assistant.intro.title')}</h2>
                <p className="mt-2 text-sm text-slate-600">{t('assistant.intro.text')}</p>
                <ul className="mt-4 space-y-2">
                  {introPoints.map((point) => (
                    <li key={point} className="flex gap-2 rounded-xl bg-cyan-50/70 p-3 text-sm text-charcoal">
                      <span className="text-cyan-600">•</span> {point}
                    </li>
                  ))}
                </ul>
                <button onClick={acceptNotice} className="mt-5 w-full rounded-xl bg-cyan-600 px-4 py-3 font-heading font-semibold text-white hover:bg-cyan-700">
                  {t('assistant.intro.accept')}
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate('/doctors');
                  }}
                  className="mt-2 w-full rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-600/10"
                >
                  {t('assistant.intro.decline')}
                </button>
              </div>
            ) : (
              <>
                <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-offwhite p-4" aria-live="polite">
                  {messages.length === 0 && (
                    <div>
                      <p className="rounded-2xl rounded-tl-sm bg-white p-3 text-sm text-charcoal shadow-soft">{t('assistant.intro.text')}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {starters.map((s) => (
                          <button key={s} onClick={() => send(s)} className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-cyan-700 hover:bg-cyan-50">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) =>
                    m.role === 'user' ? (
                      <div key={i} className="flex justify-end">
                        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-cyan-600 px-3.5 py-2 text-sm text-white">{m.content}</p>
                      </div>
                    ) : (
                      <div key={i} className="space-y-2.5">
                        {m.mode === 'emergency' ? (
                          <Emergency safety={m.safety} />
                        ) : (
                          <>
                            {m.safety?.level === 'caution' && <Caution safety={m.safety} />}
                            <p className={`max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 text-sm shadow-soft ${m.error ? 'text-error' : 'text-charcoal'}`}>{m.content}</p>
                            {m.degraded && <p className="text-[11px] text-slate-600">{t('assistant.guidedNotice')}</p>}
                          </>
                        )}
                        {m.cards?.map((card, ci) => (
                          <Card key={ci} card={card} onNavigate={() => setOpen(false)} />
                        ))}
                      </div>
                    )
                  )}

                  {loading && (
                    <div className="flex items-center gap-2 text-xs text-slate-600" role="status">
                      <span className="flex gap-1">
                        {[0, 1, 2].map((d) => (
                          <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-500" style={{ animationDelay: `${d * 0.15}s` }} />
                        ))}
                      </span>
                      {t('assistant.thinking')}
                    </div>
                  )}

                  {!loading && lastAssistant?.suggestions?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {lastAssistant.suggestions.map((s) => (
                        <button key={s} onClick={() => send(s)} className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-50">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                  className="flex items-end gap-2 border-t border-slate-600/10 bg-white p-3 sm:rounded-b-3xl"
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    rows={1}
                    maxLength={1000}
                    placeholder={t('assistant.placeholder')}
                    aria-label={t('assistant.placeholder')}
                    className="max-h-28 flex-1 resize-none rounded-xl border border-slate-600/20 bg-offwhite px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    aria-label={t('assistant.send')}
                    className="rounded-xl bg-orange-500 p-3 text-white hover:bg-orange-600 disabled:opacity-40"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

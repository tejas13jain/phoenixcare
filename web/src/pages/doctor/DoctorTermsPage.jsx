import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, FileText, Printer, ScrollText, ShieldCheck } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Button, Card, Skeleton } from '../../components/ui/index.js';
import { doctorApi } from '../../api/doctorApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { markTermsAccepted } from '../../components/layout/doctorTermsGate.js';

// First-login screen: a doctor must read and accept the Doctor Terms & Conditions before
// they can practise. After that it stays available as a read-only copy.
export function DoctorTermsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [ticked, setTicked] = useState({});
  const [reachedEnd, setReachedEnd] = useState(false);
  const [saving, setSaving] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    doctorApi
      .getMyTerms()
      .then((res) => setData(res.data))
      .catch((err) => toast.error(extractErrorMessage(err)));
  }, []);

  const accepted = data?.status.accepted;

  // The declarations unlock once the doctor has scrolled to the end of the conditions.
  useEffect(() => {
    if (!data || accepted || !endRef.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setReachedEnd(true), { threshold: 0.1 });
    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, [data, accepted]);

  const allTicked = data?.terms.declarations.every((d) => ticked[d.id]);

  const handleAccept = async () => {
    setSaving(true);
    try {
      const res = await doctorApi.acceptTerms({
        version: data.terms.version,
        declarations: data.terms.declarations.filter((d) => ticked[d.id]).map((d) => d.id),
      });
      markTermsAccepted();
      toast.success(res.message);
      navigate(location.state?.from?.pathname || '/doctor/dashboard', { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <PageTransition>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageTransition>
    );
  }

  const { terms, status } = data;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-cyan-50 via-sky-50 to-cyan-100/70 p-6 sm:p-8 mb-8 print:bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-700">
                <ShieldCheck size={14} /> {accepted ? 'Terms accepted' : 'One last step before you start'}
              </p>
              <h1 className="mt-2 font-heading font-extrabold text-2xl sm:text-3xl text-charcoal">{terms.title}</h1>
              <p className="mt-2 text-sm text-slate-600">{terms.intro}</p>
              <p className="mt-2 text-xs text-slate-600">
                Version {terms.version}. These conditions are written in English so that every doctor reads the same text.
              </p>
            </div>
            <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
              <Printer size={16} /> Print / save as PDF
            </Button>
          </div>

          {accepted ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-charcoal shadow-soft">
              <CheckCircle2 size={18} className="text-emerald-600" />
              You accepted version {status.acceptedVersion} on {new Date(status.acceptedAt).toLocaleString()}.
            </p>
          ) : (
            <p className="mt-4 text-sm font-medium text-charcoal">
              Please read all {terms.sections.length} sections, then confirm at the bottom. You can’t open slots, take consultations or
              write prescriptions until you accept.
            </p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <nav aria-label="Sections" className="hidden lg:block print:hidden">
            <ul className="sticky top-24 space-y-1 text-sm">
              {terms.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#terms-${s.id}`} className="block rounded-lg px-3 py-1.5 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-5">
            {terms.sections.map((section) => (
              <Card key={section.id} id={`terms-${section.id}`} className="scroll-mt-24 print:shadow-none print:border print:break-inside-avoid">
                <h2 className="font-heading font-bold text-lg text-charcoal">{section.title}</h2>
                {section.law && (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-600">
                    <ScrollText size={13} className="mt-0.5 shrink-0" /> {section.law}
                  </p>
                )}
                <ul className="mt-3 space-y-2.5">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-charcoal">
                      <FileText size={15} className="mt-1 shrink-0 text-cyan-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}

            <div ref={endRef} />

            {!accepted && (
              <Card className="border-2 border-cyan-400 print:hidden">
                <h2 className="font-heading font-bold text-lg text-charcoal">Your declaration</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {reachedEnd ? 'Tick every box to confirm, then accept.' : 'Scroll through all the conditions above to unlock this section.'}
                </p>
                <div className="mt-4 space-y-3">
                  {terms.declarations.map((d) => (
                    <label key={d.id} className={`flex items-start gap-3 ${reachedEnd ? 'cursor-pointer' : 'opacity-50'}`}>
                      <input
                        type="checkbox"
                        disabled={!reachedEnd}
                        checked={!!ticked[d.id]}
                        onChange={(e) => setTicked((t) => ({ ...t, [d.id]: e.target.checked }))}
                        className="mt-1 h-4 w-4 accent-cyan-600"
                      />
                      <span className="text-sm text-charcoal">{d.text}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-5 flex justify-end">
                  <Button onClick={handleAccept} disabled={!reachedEnd || !allTicked} loading={saving}>
                    I accept — start practising
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

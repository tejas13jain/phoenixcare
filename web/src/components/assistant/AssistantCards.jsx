import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CalendarCheck, ChevronDown, Clock, HeartPulse, PhoneCall, Star } from 'lucide-react';

// Everything the patient sees in these cards (names, fees, ratings, times) arrives from the
// server's own data — the AI only chooses *which* cards to show and writes the sentences around
// them. That is what keeps the details trustworthy.

const MODE_ORDER = ['video', 'audio', 'chat', 'in_clinic'];

// Where a booking link goes: the booking page with the mode and exact slot already chosen.
export function bookingPath(doctorId, { mode, slotId } = {}) {
  const params = new URLSearchParams();
  if (mode) params.set('mode', mode);
  if (slotId) params.set('slot', slotId);
  const qs = params.toString();
  return `/book/${doctorId}${qs ? `?${qs}` : ''}`;
}

function pickMode(wanted, doctorModes = [], slotModes = []) {
  const usable = (m) => doctorModes.includes(m) && (!slotModes.length || slotModes.includes(m));
  if (wanted && usable(wanted)) return wanted;
  return MODE_ORDER.find(usable) || doctorModes[0] || 'video';
}

const initials = (name = '') =>
  name
    .replace(/^dr\.?\s*/i, '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function Emergency({ safety, onCall }) {
  const { t } = useTranslation();
  const selfHarm = safety?.category === 'self_harm';
  return (
    <div role="alert" className="rounded-2xl border-2 border-error bg-error/5 p-4">
      <p className="flex items-center gap-2 font-heading font-bold text-error">
        <AlertTriangle size={18} /> {t('assistant.emergency.title')}
      </p>
      <p className="mt-2 text-sm text-charcoal">{selfHarm ? t('assistant.emergency.selfHarm') : t('assistant.emergency.general')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href="tel:112" onClick={onCall} className="inline-flex items-center gap-1.5 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white">
          <PhoneCall size={15} /> {t('assistant.emergency.call112')}
        </a>
        {selfHarm && (
          <a href="tel:14416" className="inline-flex items-center gap-1.5 rounded-lg border-2 border-error px-4 py-2 text-sm font-semibold text-error">
            <HeartPulse size={15} /> {t('assistant.emergency.callHelpline')}
          </a>
        )}
      </div>
    </div>
  );
}

export function Caution({ safety }) {
  const { t } = useTranslation();
  const known = ['heart', 'fainting', 'seizure'].includes(safety?.category) ? safety.category : 'other';
  return (
    <div role="note" className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <AlertTriangle size={16} /> {t('assistant.caution.title')}
      </p>
      <p className="mt-1 text-sm text-amber-900">{t(`assistant.caution.${known}`)}</p>
      <a href="tel:112" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 underline">
        <PhoneCall size={14} /> {t('assistant.emergency.call112')}
      </a>
    </div>
  );
}

function Why({ doctor }) {
  const { t } = useTranslation();
  return (
    <div className="mt-3 rounded-xl bg-offwhite p-3">
      <ul className="space-y-1 text-xs text-charcoal">
        {doctor.reasons.map((reason) => (
          <li key={reason} className="flex gap-1.5">
            <span className="text-cyan-600">•</span> {reason}
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-1.5" aria-label={t('assistant.cards.matchScore')}>
        {doctor.breakdown.map((b) => (
          <div key={b.key} className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="w-28 shrink-0">{t(`assistant.criteria.${b.key}`)}</span>
            <span className="h-1.5 flex-1 rounded-full bg-slate-600/10">
              <span className="block h-full rounded-full bg-cyan-500" style={{ width: `${Math.round((b.points / b.max) * 100)}%` }} />
            </span>
            <span className="w-12 text-right tabular-nums">
              {b.points}/{b.max}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-600">{t('assistant.cards.scoreNote')}</p>
    </div>
  );
}

function DoctorRow({ doctor, wantedMode, onNavigate, first }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const mode = pickMode(wantedMode, doctor.modes, doctor.nextSlot?.modes);
  // The price shown is for the mode the Book button opens, so it matches what they will pay.
  const fee = doctor.fees?.[mode] ?? doctor.fee;

  return (
    <div className={`rounded-2xl border bg-white p-3.5 ${first ? 'border-cyan-300 shadow-soft' : 'border-slate-600/10'}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-500 text-sm font-bold text-white">
          {initials(doctor.name)}
        </span>
        <div className="min-w-0 flex-1">
          <Link to={`/doctors/${doctor.id}`} onClick={onNavigate} className="font-heading font-semibold text-charcoal hover:underline">
            {doctor.name}
          </Link>
          <p className="text-xs text-slate-600">{doctor.specialties.join(', ')}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(doctor.badges || []).map((b) => (
              <span key={b} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${b === 'best_overall' ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-700'}`}>
                {t(`assistant.badges.${b}`)}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-heading text-lg font-extrabold leading-none text-cyan-700">{Math.round(doctor.score)}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-600">{t('assistant.cards.matchScore')}</p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
        {doctor.ratingCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Star size={12} className="fill-amber-400 text-amber-400" /> {doctor.rating} ({t('assistant.cards.reviewCount', { count: doctor.ratingCount })})
          </span>
        ) : (
          <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">{t('assistant.cards.newDoctor')}</span>
        )}
        {doctor.experienceYears > 0 && <span>{t('assistant.cards.years', { count: doctor.experienceYears })}</span>}
        {fee != null && (
          <span className="font-medium text-charcoal">
            ₹{fee} <span className="font-normal text-slate-600">· {t(`assistant.modes.${mode}`)}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> {doctor.nextSlot ? `${t('assistant.cards.next')}: ${doctor.nextSlot.label}` : t('assistant.cards.noSlot')}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:underline">
          {open ? t('assistant.cards.hide') : t('assistant.cards.whyThis')}
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <Link
          to={bookingPath(doctor.id, { mode, slotId: doctor.nextSlot?.slotId })}
          onClick={onNavigate}
          className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          {t('assistant.cards.book')}
        </Link>
      </div>
      {open && <Why doctor={doctor} />}
    </div>
  );
}

export function DoctorsCard({ card, onNavigate }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      {card.doctors.length > 1 && <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('assistant.cards.bestMatches')}</p>}
      {card.budgetRelaxed && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{t('assistant.cards.budgetNote')}</p>}
      {card.doctors.map((d, i) => (
        <DoctorRow key={d.id} doctor={d} wantedMode={card.need?.mode} onNavigate={onNavigate} first={i === 0 && card.doctors.length > 1} />
      ))}
    </div>
  );
}

export function SlotsCard({ card, onNavigate }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (!card.slots.length) return <p className="text-sm text-slate-600">{t('assistant.cards.noSlotsFound')}</p>;

  const go = (slot) => {
    onNavigate?.();
    navigate(bookingPath(card.doctor.id, { mode: pickMode(card.mode || 'video', slot.modes, slot.modes), slotId: slot.slotId }));
  };
  return (
    <div className="rounded-2xl border border-slate-600/10 bg-white p-3.5">
      <p className="text-sm font-semibold text-charcoal">{t('assistant.cards.pickTime', { name: card.doctor.name })}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {card.slots.map((slot) => (
          <button key={slot.slotId} onClick={() => go(slot)} className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-50">
            {slot.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BookingCard({ card, onNavigate }) {
  const { t } = useTranslation();
  const { booking } = card;
  return (
    <div className="rounded-2xl border-2 border-cyan-400 bg-white p-4">
      <p className="flex items-center gap-2 font-heading font-semibold text-charcoal">
        <CalendarCheck size={18} className="text-cyan-600" /> {t('assistant.cards.bookingTitle')}
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-slate-600">{booking.doctorName}</dt>
        <dd className="text-right font-medium">{booking.label}</dd>
        <dt className="text-slate-600">{t(`assistant.modes.${booking.mode}`)}</dt>
        <dd className="text-right font-medium">{booking.fee != null ? `₹${booking.fee}` : ''}</dd>
      </dl>
      <Link
        to={bookingPath(booking.doctorId, { mode: booking.mode, slotId: booking.slotId })}
        onClick={onNavigate}
        className="mt-3 block rounded-lg bg-orange-500 px-4 py-2.5 text-center font-heading font-semibold text-white hover:bg-orange-600"
      >
        {t('assistant.cards.reviewAndBook')}
      </Link>
      <p className="mt-2 text-xs text-slate-600">{t('assistant.cards.confirmNote')}</p>
    </div>
  );
}

// Highlights the best cell in a row.
function best(values, pick) {
  const nums = values.map((v) => (v == null ? null : v));
  const valid = nums.filter((v) => v != null);
  if (valid.length < 2) return -1;
  const target = pick === 'min' ? Math.min(...valid) : Math.max(...valid);
  return nums.indexOf(target);
}

export function ComparisonCard({ card, onNavigate }) {
  const { t } = useTranslation();
  const docs = card.doctors;
  const rows = [
    { key: 'overall', label: t('assistant.cards.overall'), cells: docs.map((d) => `${Math.round(d.score)}/100`), values: docs.map((d) => d.score), pick: 'max' },
    { key: 'rating', label: t('assistant.cards.rating'), cells: docs.map((d) => (d.ratingCount ? `${d.rating} (${d.ratingCount})` : t('assistant.cards.newDoctor'))), values: docs.map((d) => (d.ratingCount >= 5 ? d.rating : null)), pick: 'max' },
    { key: 'experience', label: t('assistant.cards.experience'), cells: docs.map((d) => t('assistant.cards.years', { count: d.experienceYears })), values: docs.map((d) => d.experienceYears), pick: 'max' },
    { key: 'fee', label: t('assistant.cards.fee'), cells: docs.map((d) => (d.fee != null ? `₹${d.fee} · ${t(`assistant.modes.${d.feeMode}`)}` : '—')), values: docs.map((d) => d.fee ?? null), pick: 'min' },
    { key: 'next', label: t('assistant.cards.nextAvailable'), cells: docs.map((d) => d.nextSlot?.label || '—'), values: docs.map((d) => (d.nextSlot ? new Date(`${d.nextSlot.date}T${d.nextSlot.startTime}`).getTime() : null)), pick: 'min' },
    { key: 'lang', label: t('assistant.cards.languages'), cells: docs.map((d) => d.languages.join(', ') || '—'), values: [], pick: 'max' },
  ];
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-600/10 bg-white">
      <table className="w-full text-left text-xs">
        <caption className="sr-only">{t('assistant.cards.compareTitle')}</caption>
        <thead>
          <tr className="bg-offwhite">
            <th className="p-2.5 font-medium text-slate-600" />
            {docs.map((d) => (
              <th key={d.id} className="p-2.5 align-top font-heading font-semibold text-charcoal">
                <Link to={`/doctors/${d.id}`} onClick={onNavigate} className="hover:underline">
                  {d.name}
                </Link>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(d.badges || []).slice(0, 2).map((b) => (
                    <span key={b} className="rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700">
                      {t(`assistant.badges.${b}`)}
                    </span>
                  ))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const winner = best(row.values, row.pick);
            return (
              <tr key={row.key} className="border-t border-slate-600/10">
                <th scope="row" className="p-2.5 font-medium text-slate-600">
                  {row.label}
                </th>
                {row.cells.map((cell, i) => (
                  <td key={i} className={`p-2.5 ${i === winner ? 'font-semibold text-emerald-700' : 'text-charcoal'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex gap-2 border-t border-slate-600/10 p-2.5">
        {docs.map((d) => (
          <Link key={d.id} to={bookingPath(d.id, { mode: pickMode(null, d.modes, d.nextSlot?.modes), slotId: d.nextSlot?.slotId })} onClick={onNavigate} className="flex-1 rounded-lg bg-orange-500 px-2 py-1.5 text-center text-xs font-semibold text-white hover:bg-orange-600">
            {t('assistant.cards.book')} · {d.name.replace(/^dr\.?\s*/i, '').split(' ')[0]}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Card({ card, onNavigate }) {
  if (card.type === 'doctors') return <DoctorsCard card={card} onNavigate={onNavigate} />;
  if (card.type === 'slots') return <SlotsCard card={card} onNavigate={onNavigate} />;
  if (card.type === 'booking') return <BookingCard card={card} onNavigate={onNavigate} />;
  if (card.type === 'comparison') return <ComparisonCard card={card} onNavigate={onNavigate} />;
  return null;
}

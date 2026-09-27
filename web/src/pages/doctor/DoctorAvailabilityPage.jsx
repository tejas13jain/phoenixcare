import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarPlus } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Card, Button, Input, Badge } from '../../components/ui/index.js';
import { doctorApi } from '../../api/doctorApi.js';
import { extractErrorMessage } from '../../api/client.js';

const ALL_MODES = ['video', 'audio', 'chat', 'in_clinic'];

function nextNDates(n) {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= n; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const STATUS_VARIANT = { available: 'success', booked: 'teal', blocked: 'error' };

export function DoctorAvailabilityPage() {
  const [form, setForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 30,
    days: 7,
    modes: ['video', 'audio', 'chat'],
  });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadSlots = () => {
    setLoading(true);
    const dates = nextNDates(14);
    doctorApi
      .getSlots('me', { from: dates[0], to: dates[dates.length - 1] })
      .then((res) => setSlots(res.data.slots))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadSlots, []);

  const slotsByDate = useMemo(() => {
    const grouped = {};
    for (const slot of slots) {
      grouped[slot.date] = grouped[slot.date] || [];
      grouped[slot.date].push(slot);
    }
    return grouped;
  }, [slots]);

  const toggleMode = (mode) => {
    setForm((f) => ({
      ...f,
      modes: f.modes.includes(mode) ? f.modes.filter((m) => m !== mode) : [...f.modes, mode],
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (form.modes.length === 0) return toast.error('Select at least one consultation mode');
    setGenerating(true);
    try {
      const dates = nextNDates(form.days);
      await doctorApi.generateSlots({
        dates,
        startTime: form.startTime,
        endTime: form.endTime,
        slotDurationMinutes: Number(form.slotDurationMinutes),
        modes: form.modes,
      });
      toast.success('Availability generated');
      loadSlots();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="font-heading font-bold text-2xl">Manage availability</h1>

        <Card>
          <h2 className="font-heading font-semibold mb-4 flex items-center gap-2">
            <CalendarPlus size={18} /> Generate slots for the next {form.days} days
          </h2>
          <form onSubmit={handleGenerate} className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Start time"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            />
            <Input
              label="End time"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            />
            <Input
              label="Slot duration (minutes)"
              type="number"
              min={5}
              max={120}
              value={form.slotDurationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, slotDurationMinutes: e.target.value }))}
            />
            <Input
              label="Days ahead"
              type="number"
              min={1}
              max={30}
              value={form.days}
              onChange={(e) => setForm((f) => ({ ...f, days: Number(e.target.value) }))}
            />
            <div className="sm:col-span-2">
              <label className="block mb-1.5 text-sm font-medium text-charcoal">Consultation modes</label>
              <div className="flex flex-wrap gap-2">
                {ALL_MODES.map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => toggleMode(mode)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
                      form.modes.includes(mode) ? 'bg-phoenix-gradient text-white' : 'bg-slate-600/10 text-slate-600'
                    }`}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="sm:col-span-2" loading={generating}>
              Generate availability
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-heading font-semibold mb-4">Upcoming schedule</h2>
          {loading ? (
            <p className="text-sm text-slate-600">Loading…</p>
          ) : Object.keys(slotsByDate).length === 0 ? (
            <p className="text-sm text-slate-600">No slots generated yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                <div key={date}>
                  <p className="text-sm font-medium mb-2">{date}</p>
                  <div className="flex flex-wrap gap-2">
                    {dateSlots.map((slot) => (
                      <Badge key={slot._id} variant={STATUS_VARIANT[slot.status]}>
                        {slot.startTime} · {slot.status}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}

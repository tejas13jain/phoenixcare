import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HeartPulse, Activity, Thermometer, Droplets } from 'lucide-react';
import { Card, Button, Input, Skeleton } from '../ui/index.js';
import { wellnessApi } from '../../api/pushApi.js';
import { extractErrorMessage } from '../../api/client.js';

const FIELDS = [
  { key: 'bloodPressureSystolic', label: 'BP Systolic', unit: 'mmHg', icon: HeartPulse },
  { key: 'bloodPressureDiastolic', label: 'BP Diastolic', unit: 'mmHg', icon: HeartPulse },
  { key: 'pulse', label: 'Pulse', unit: 'bpm', icon: Activity },
  { key: 'spo2', label: 'SpO2', unit: '%', icon: Droplets },
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer },
  { key: 'bloodSugar', label: 'Blood sugar', unit: 'mg/dL', icon: Droplets },
];

export function VitalsCard({ onXpAwarded }) {
  const [logs, setLogs] = useState(undefined);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = () => {
    wellnessApi
      .getVitalsHistory()
      .then((res) => setLogs(res.data.logs))
      .catch(() => setLogs([]));
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setErrors({});

    const payload = {};
    for (const f of FIELDS) {
      if (form[f.key] !== undefined && form[f.key] !== '') payload[f.key] = Number(form[f.key]);
    }
    if (Object.keys(payload).length === 0) {
      setErrors({ _form: 'Enter at least one reading before saving.' });
      return;
    }

    setSaving(true);
    try {
      const res = await wellnessApi.logVitals(payload);
      toast.success('Vitals recorded');
      if (res.data.xpAwarded > 0) onXpAwarded?.();
      setForm({});
      setExpanded(false);
      load();
    } catch (err) {
      // Surface field-level validation messages from the backend (Zod) directly under each input.
      const details = err?.response?.data?.details;
      if (details?.length) {
        const fieldErrors = {};
        for (const d of details) fieldErrors[d.path.replace('body.', '')] = d.message;
        setErrors(fieldErrors);
      } else {
        toast.error(extractErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  if (logs === undefined) return <Skeleton className="h-40 w-full" />;

  const latest = logs[0];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-charcoal flex items-center gap-2">
          <HeartPulse size={18} className="text-error" /> Health vitals
        </h3>
        <Button size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Close' : 'Log vitals'}
        </Button>
      </div>

      {latest ? (
        <div className="grid grid-cols-3 gap-2 mb-2 text-center">
          {latest.bloodPressureSystolic && (
            <MiniStat label="BP" value={`${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic || '—'}`} />
          )}
          {latest.pulse && <MiniStat label="Pulse" value={`${latest.pulse} bpm`} />}
          {latest.spo2 && <MiniStat label="SpO2" value={`${latest.spo2}%`} />}
        </div>
      ) : (
        !expanded && <p className="text-sm text-slate-600">No readings logged yet.</p>
      )}

      {expanded && (
        <form onSubmit={save} className="mt-3 space-y-3">
          {errors._form && <p className="text-xs text-error">{errors._form}</p>}
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <Input
                key={f.key}
                label={`${f.label} (${f.unit})`}
                type="number"
                step="0.1"
                value={form[f.key] || ''}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                error={errors[f.key]}
              />
            ))}
          </div>
          <Button type="submit" size="sm" loading={saving} className="w-full">
            Save readings
          </Button>
        </form>
      )}
    </Card>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-600/5 py-2">
      <p className="font-heading font-bold text-sm text-charcoal">{value}</p>
      <p className="text-[10px] text-slate-600">{label}</p>
    </div>
  );
}

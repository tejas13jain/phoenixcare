import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Button, Input } from './ui/index.js';
import { prescriptionApi } from '../api/appointmentApi.js';
import { extractErrorMessage } from '../api/client.js';

const emptyMedicine = { name: '', dosage: '', frequency: '', durationDays: 5, instructions: '' };

export function PrescriptionWriter({ appointmentId, onDone }) {
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([{ ...emptyMedicine }]);
  const [advice, setAdvice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateMedicine = (index, field, value) => {
    setMedicines((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await prescriptionApi.create({
        appointmentId,
        diagnosis: diagnosis ? diagnosis.split(',').map((d) => d.trim()) : [],
        medicines: medicines.filter((m) => m.name.trim()).map((m) => ({ ...m, durationDays: Number(m.durationDays) })),
        advice,
      });
      toast.success('Prescription issued and shared with patient');
      onDone?.();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="font-heading font-semibold text-lg mb-4">Digital prescription</h2>

      <Input
        label="Diagnosis (comma-separated)"
        value={diagnosis}
        onChange={(e) => setDiagnosis(e.target.value)}
        placeholder="Acute viral fever"
        className="mb-4"
      />

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-charcoal">Medicines</label>
          <button
            className="text-teal-600 text-sm flex items-center gap-1"
            onClick={() => setMedicines((prev) => [...prev, { ...emptyMedicine }])}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {medicines.map((med, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end bg-slate-600/5 rounded-xl p-3">
            <Input label="Name" value={med.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)} />
            <Input label="Dosage" value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} />
            <Input
              label="Frequency"
              value={med.frequency}
              onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
              placeholder="1-0-1"
            />
            <Input
              label="Days"
              type="number"
              value={med.durationDays}
              onChange={(e) => updateMedicine(i, 'durationDays', e.target.value)}
            />
            <button
              className="text-error flex items-center justify-center h-9"
              onClick={() => setMedicines((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <label className="block mb-1.5 text-sm font-medium text-charcoal">Advice</label>
        <textarea
          className="w-full rounded-xl border border-slate-600/20 px-4 py-2.5 text-sm"
          rows={3}
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
          placeholder="Rest, hydration, follow-up in 5 days if symptoms persist"
        />
      </div>

      <Button className="w-full" loading={submitting} onClick={submit}>
        Issue prescription & complete consultation
      </Button>
    </Card>
  );
}

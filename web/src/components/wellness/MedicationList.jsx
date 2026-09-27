import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Pill, Plus, X, Bell } from 'lucide-react';
import { Card, Button, Input, Badge, Skeleton } from '../ui/index.js';
import { medicationApi } from '../../api/pushApi.js';
import { extractErrorMessage } from '../../api/client.js';

export function MedicationList() {
  const [medications, setMedications] = useState(undefined);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', dosage: '', times: '08:00' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    medicationApi
      .list()
      .then((res) => setMedications(res.data.medications))
      .catch(() => setMedications([]));
  };

  useEffect(load, []);

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const times = form.times.split(',').map((t) => t.trim()).filter(Boolean);
      await medicationApi.create({ name: form.name, dosage: form.dosage, times });
      toast.success('Reminder added — we\'ll notify you at the scheduled time');
      setForm({ name: '', dosage: '', times: '08:00' });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await medicationApi.remove(id);
      setMedications((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (medications === undefined) return <Skeleton className="h-40 w-full" />;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-charcoal flex items-center gap-2">
          <Pill size={18} className="text-sunrise-500" /> Medication reminders
        </h3>
        <button onClick={() => setShowForm((v) => !v)} className="text-teal-600 hover:text-teal-700">
          <Plus size={18} />
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={add}
            className="space-y-3 mb-4 overflow-hidden"
          >
            <Input label="Medicine name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <Input label="Dosage" placeholder="1 tablet" value={form.dosage} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} required />
            <Input
              label="Reminder times (comma-separated, 24h)"
              placeholder="08:00, 20:00"
              value={form.times}
              onChange={(e) => setForm((f) => ({ ...f, times: e.target.value }))}
              required
            />
            <Button type="submit" size="sm" loading={saving} className="w-full">
              Add reminder
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {medications.length === 0 ? (
        <p className="text-sm text-slate-600">No medication reminders yet — add one to get notified at the right time.</p>
      ) : (
        <div className="space-y-2">
          {medications.map((med) => (
            <div key={med._id} className="flex items-center justify-between rounded-xl bg-slate-600/5 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-charcoal">{med.name}</p>
                <p className="text-xs text-slate-600">{med.dosage}</p>
                <div className="flex gap-1 mt-1">
                  {med.times.map((t) => (
                    <Badge key={t} variant="teal">
                      <Bell size={10} className="mr-1" /> {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <button onClick={() => remove(med._id)} className="text-slate-600 hover:text-error">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

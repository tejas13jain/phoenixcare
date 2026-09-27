import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { wellnessApi } from '../../api/pushApi.js';
import { extractErrorMessage } from '../../api/client.js';

// Small inline "edit goal" affordance shared by trackers that have a user-configurable daily
// target (water glasses, step count, ...). Keeps goal editing a one-click affair instead of a
// separate settings page.
export function GoalEditButton({ type, currentGoal, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentGoal);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const num = Number(value);
    if (!num || num <= 0) {
      toast.error('Enter a positive target value');
      return;
    }
    setSaving(true);
    try {
      await wellnessApi.setGoal(type, num);
      toast.success('Goal updated');
      setEditing(false);
      onSaved?.(num);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button onClick={() => { setValue(currentGoal); setEditing(true); }} className="text-slate-600/60 hover:text-teal-600">
        <Pencil size={12} />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        min={1}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        className="w-14 rounded border border-slate-600/20 px-1 py-0.5 text-xs"
      />
      <button onClick={save} disabled={saving} className="text-success">
        <Check size={14} />
      </button>
      <button onClick={() => setEditing(false)} className="text-error">
        <X size={14} />
      </button>
    </span>
  );
}

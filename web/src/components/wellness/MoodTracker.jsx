import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Wind, X } from 'lucide-react';
import { Card, Button } from '../ui/index.js';
import { wellnessApi } from '../../api/pushApi.js';

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'low', emoji: '😔', label: 'Low' },
  { value: 'struggling', emoji: '😣', label: 'Struggling' },
];

export function MoodTracker({ onXpAwarded }) {
  const [logs, setLogs] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);

  const load = () => {
    wellnessApi
      .getMoodHistory()
      .then((res) => setLogs(res.data.logs))
      .catch(() => setLogs([]));
  };

  useEffect(load, []);

  const logMood = async (mood) => {
    setSaving(true);
    try {
      const res = await wellnessApi.logMood({ mood });
      if (res.data.xpAwarded > 0) {
        toast.success(`+${res.data.xpAwarded} XP — thanks for checking in 🧘`);
        onXpAwarded?.();
      } else {
        toast.success('Mood updated for today');
      }
      load();
    } catch {
      toast.error('Could not save your mood');
    } finally {
      setSaving(false);
    }
  };

  if (logs === undefined) return null;

  const today = logs[0];

  return (
    <>
      <Card>
        <h3 className="font-heading font-semibold text-charcoal mb-1">Mental wellness</h3>
        <p className="text-xs text-slate-600 mb-3">How are you feeling today?</p>
        <div className="flex justify-between gap-1 mb-4">
          {MOODS.map((m) => (
            <motion.button
              key={m.value}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1, y: -2 }}
              disabled={saving}
              onClick={() => logMood(m.value)}
              className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-2 text-2xl ${
                today?.mood === m.value ? 'bg-phoenix-gradient-soft ring-2 ring-teal-500' : 'hover:bg-slate-600/5'
              }`}
              title={m.label}
            >
              <span>{m.emoji}</span>
              <span className="text-[9px] text-slate-600">{m.label}</span>
            </motion.button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowBreathing(true)}>
          <Wind size={16} className="mr-1.5" /> Take a 1-minute breathing break
        </Button>
      </Card>

      <BreathingExercise open={showBreathing} onClose={() => setShowBreathing(false)} />
    </>
  );
}

function BreathingExercise({ open, onClose }) {
  const [phase, setPhase] = useState('inhale');

  useEffect(() => {
    if (!open) return;
    setPhase('inhale');
    const cycle = ['inhale', 'hold', 'exhale'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % cycle.length;
      setPhase(cycle[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, [open]);

  const scale = phase === 'inhale' ? 1.4 : phase === 'hold' ? 1.4 : 0.8;
  const label = { inhale: 'Breathe in…', hold: 'Hold…', exhale: 'Breathe out…' }[phase];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-charcoal/90 backdrop-blur-sm"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white">
            <X size={28} />
          </button>
          <motion.div
            animate={{ scale }}
            transition={{ duration: 4, ease: 'easeInOut' }}
            className="h-40 w-40 rounded-full bg-phoenix-gradient shadow-soft-lg"
          />
          <p className="mt-8 text-white text-lg font-heading">{label}</p>
          <p className="mt-2 text-white/60 text-sm">Follow the circle — in, hold, and out</p>
          <Button variant="secondary" className="mt-8 !bg-white/10 !text-white" onClick={onClose}>
            Done
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

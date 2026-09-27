import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Skeleton } from '../ui/index.js';
import { wellnessApi } from '../../api/pushApi.js';

export function WaterTracker({ onXpAwarded }) {
  const [log, setLog] = useState(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    wellnessApi
      .getTodayWater()
      .then((res) => setLog(res.data.log))
      .catch(() => setLog({ glasses: 0, goal: 8 }));
  }, []);

  const adjust = async (delta) => {
    if (busy || !log) return;
    setBusy(true);
    const previousGlasses = log.glasses;
    setLog((l) => ({ ...l, glasses: Math.max(0, Math.min(20, l.glasses + delta)) }));
    try {
      const res = await wellnessApi.logWater(delta);
      setLog(res.data.log);
      if (res.data.xpAwarded > 0) {
        toast.success(`+${res.data.xpAwarded} XP — day streak extended! 🔥`);
        onXpAwarded?.();
      }
      if (delta > 0 && res.data.log.glasses === res.data.log.goal) {
        toast.success("Goal reached! You've had all your water for today 💧");
      }
    } catch {
      setLog((l) => ({ ...l, glasses: previousGlasses }));
    } finally {
      setBusy(false);
    }
  };

  if (log === undefined) return <Skeleton className="h-40 w-full" />;

  const goal = log.goal || 8;
  const pct = Math.min(100, Math.round((log.glasses / goal) * 100));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-charcoal flex items-center gap-2">
          <Droplet size={18} className="text-sky-500" /> Water intake
        </h3>
        <span className="text-sm font-medium text-slate-600">
          {log.glasses} / {goal} glasses
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative h-24 w-16 shrink-0 rounded-b-2xl rounded-t-md border-2 border-sky-200 overflow-hidden bg-white">
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-500 to-sky-300"
            initial={{ height: 0 }}
            animate={{ height: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Array.from({ length: goal }).map((_, i) => (
              <motion.span
                key={i}
                animate={{ scale: i < log.glasses ? 1 : 0.9, opacity: i < log.glasses ? 1 : 0.35 }}
                className="text-sky-500"
              >
                <Droplet size={16} fill={i < log.glasses ? 'currentColor' : 'none'} />
              </motion.span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjust(-1)}
              disabled={busy || log.glasses === 0}
              className="h-9 w-9 rounded-full bg-slate-600/10 flex items-center justify-center disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={() => adjust(1)}
              disabled={busy}
              className="flex-1 h-9 rounded-xl bg-sky-500 text-white text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-60"
            >
              <Plus size={16} /> Add a glass
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

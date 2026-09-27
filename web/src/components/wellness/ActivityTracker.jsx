import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Footprints } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Skeleton } from '../ui/index.js';
import { wellnessApi } from '../../api/pushApi.js';

const STEP_GOAL = 8000;
const QUICK_ADD = [500, 1000, 2000];

export function ActivityTracker({ onXpAwarded }) {
  const [log, setLog] = useState(undefined);
  const [busy, setBusy] = useState(false);

  const load = () => {
    wellnessApi
      .getTodayActivity()
      .then((res) => setLog(res.data.log))
      .catch(() => setLog({ steps: 0 }));
  };

  useEffect(load, []);

  const addSteps = async (steps) => {
    setBusy(true);
    try {
      const res = await wellnessApi.logActivity(steps);
      setLog(res.data.log);
      if (res.data.xpAwarded > 0) {
        toast.success(`+${res.data.xpAwarded} XP — first activity logged today! 🚶`);
        onXpAwarded?.();
      }
      if (res.data.log.steps >= STEP_GOAL && log?.steps < STEP_GOAL) {
        toast.success("Step goal reached! Great job 🎉");
      }
    } catch {
      toast.error('Could not log activity');
    } finally {
      setBusy(false);
    }
  };

  if (log === undefined) return <Skeleton className="h-40 w-full" />;

  const pct = Math.min(100, Math.round((log.steps / STEP_GOAL) * 100));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-charcoal flex items-center gap-2">
          <Footprints size={18} className="text-sunrise-500" /> Activity
        </h3>
        <span className="text-sm font-medium text-slate-600">
          {log.steps.toLocaleString()} / {STEP_GOAL.toLocaleString()} steps
        </span>
      </div>

      <div className="h-3 rounded-full bg-slate-600/10 overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-sunrise-400 to-sunrise-600"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </div>

      <p className="text-xs text-slate-600 mb-2">Quick add</p>
      <div className="flex gap-2">
        {QUICK_ADD.map((s) => (
          <motion.button
            key={s}
            whileTap={{ scale: 0.94 }}
            disabled={busy}
            onClick={() => addSteps(s)}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-sunrise-50 text-sunrise-600 hover:bg-sunrise-100"
          >
            +{s.toLocaleString()}
          </motion.button>
        ))}
      </div>
    </Card>
  );
}

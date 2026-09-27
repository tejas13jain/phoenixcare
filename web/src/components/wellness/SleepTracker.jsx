import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Skeleton } from '../ui/index.js';
import { wellnessApi } from '../../api/pushApi.js';

const QUICK_HOURS = [5, 6, 7, 8, 9];

export function SleepTracker({ onXpAwarded }) {
  const [logs, setLogs] = useState(undefined);
  const [busy, setBusy] = useState(false);

  const load = () => {
    wellnessApi
      .getTodaySleep()
      .then((res) => setLogs(res.data.logs))
      .catch(() => setLogs([]));
  };

  useEffect(load, []);

  const logHours = async (hours) => {
    setBusy(true);
    try {
      const res = await wellnessApi.logSleep(hours, hours >= 7 ? 'good' : hours >= 5 ? 'fair' : 'poor');
      if (res.data.xpAwarded > 0) {
        toast.success(`+${res.data.xpAwarded} XP logged for sleep 😴`);
        onXpAwarded?.();
      }
      load();
    } catch {
      toast.error('Could not save your sleep log');
    } finally {
      setBusy(false);
    }
  };

  if (logs === undefined) return <Skeleton className="h-40 w-full" />;

  const today = logs[0];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-charcoal flex items-center gap-2">
          <Moon size={18} className="text-teal-600" /> Sleep
        </h3>
        {today && <span className="text-sm font-medium text-slate-600">{today.hours}h last night</span>}
      </div>

      <p className="text-xs text-slate-600 mb-2">How many hours did you sleep?</p>
      <div className="flex gap-2">
        {QUICK_HOURS.map((h) => (
          <motion.button
            key={h}
            whileTap={{ scale: 0.94 }}
            disabled={busy}
            onClick={() => logHours(h)}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold ${
              today?.hours === h ? 'bg-phoenix-gradient text-white' : 'bg-slate-600/10 text-charcoal hover:bg-slate-600/15'
            }`}
          >
            {h}h
          </motion.button>
        ))}
      </div>

      {logs.length > 1 && (
        <div className="flex items-end gap-1.5 mt-4 h-12">
          {[...logs].reverse().map((l) => (
            <div
              key={l.date}
              title={`${l.date}: ${l.hours}h`}
              className="flex-1 bg-teal-500/70 rounded-t"
              style={{ height: `${Math.min(100, (l.hours / 10) * 100)}%` }}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

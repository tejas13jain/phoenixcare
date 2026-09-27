import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Footprints, Droplet, Stethoscope, Star, Lock, Moon, Pill } from 'lucide-react';
import { Card, Skeleton } from '../ui/index.js';
import { wellnessApi } from '../../api/pushApi.js';

const BADGE_ICONS = {
  flame: Flame,
  trophy: Trophy,
  footprints: Footprints,
  droplet: Droplet,
  stethoscope: Stethoscope,
  moon: Moon,
  pill: Pill,
};

export function ProgressWidget({ refreshKey }) {
  const [progress, setProgress] = useState(undefined);

  useEffect(() => {
    wellnessApi
      .getProgress()
      .then((res) => setProgress(res.data.progress))
      .catch(() => setProgress(null));
  }, [refreshKey]);

  if (progress === undefined) return <Skeleton className="h-48 w-full" />;
  if (!progress) return null;

  const pct = Math.min(100, Math.round((progress.xpIntoLevel / progress.xpForNextLevel) * 100));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            key={progress.currentStreak}
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            className="flex items-center gap-1 rounded-full bg-sunrise-50 px-3 py-1.5"
          >
            <Flame size={18} className="text-sunrise-500 fill-sunrise-400" />
            <span className="font-heading font-bold text-sunrise-600">{progress.currentStreak}</span>
          </motion.div>
          <span className="text-xs text-slate-600">day streak</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5">
          <Star size={14} className="text-teal-600 fill-teal-500" />
          <span className="text-sm font-semibold text-teal-700">Level {progress.level}</span>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>{progress.xpIntoLevel} XP</span>
          <span>{progress.xpForNextLevel} XP to level up</span>
        </div>
        <div className="h-3 rounded-full bg-slate-600/10 overflow-hidden">
          <motion.div
            className="h-full bg-phoenix-gradient rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          />
        </div>
      </div>

      <p className="text-xs font-semibold text-charcoal mb-2">Badges</p>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {progress.badges.map((badge) => {
          const Icon = BADGE_ICONS[badge.icon] || Star;
          return (
            <motion.div
              key={badge.code}
              whileHover={{ scale: 1.08 }}
              title={badge.label}
              className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center ${
                badge.unlocked ? 'bg-phoenix-gradient-soft' : 'bg-slate-600/5'
              }`}
            >
              <span
                className={`h-9 w-9 rounded-full flex items-center justify-center ${
                  badge.unlocked ? 'bg-white text-sunrise-500 shadow-soft' : 'bg-slate-600/10 text-slate-600/40'
                }`}
              >
                {badge.unlocked ? <Icon size={16} /> : <Lock size={14} />}
              </span>
              <span className={`text-[10px] leading-tight ${badge.unlocked ? 'text-charcoal font-medium' : 'text-slate-600/50'}`}>
                {badge.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

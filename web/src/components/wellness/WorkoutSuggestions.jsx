import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { Card, Badge, Skeleton } from '../ui/index.js';
import { wellnessApi } from '../../api/pushApi.js';

const DAY_COLORS = ['bg-teal-50', 'bg-sky-50', 'bg-sunrise-50'];

export function WorkoutSuggestions() {
  const [workouts, setWorkouts] = useState(undefined);

  useEffect(() => {
    wellnessApi
      .getWorkouts()
      .then((res) => setWorkouts(res.data.workouts))
      .catch(() => setWorkouts(null));
  }, []);

  if (workouts === undefined) return <Skeleton className="h-64 w-full" />;
  if (!workouts) return null;

  return (
    <Card>
      <h3 className="font-heading font-semibold text-charcoal flex items-center gap-2 mb-4">
        <Dumbbell size={18} className="text-sunrise-500" /> This week's workout plan
      </h3>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {workouts.weeklyPlan.map((day, i) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-2xl p-3 ${DAY_COLORS[i % DAY_COLORS.length]}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-heading font-semibold text-sm text-charcoal">{day.day}</span>
              <Badge variant="neutral">{day.focus}</Badge>
            </div>
            <ul className="space-y-1">
              {day.exercises.map((ex) => (
                <li key={ex} className="text-xs text-slate-600">
                  • {ex}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <p className="text-[11px] text-slate-600 mt-4">{workouts.disclaimer}</p>
    </Card>
  );
}

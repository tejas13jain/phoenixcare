import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Footprints, Moon, Apple, Brain, Stethoscope, Sparkles } from 'lucide-react';
import { Card, Badge, Skeleton } from '../ui/index.js';
import { wellnessApi } from '../../api/pushApi.js';

const ICONS = { droplet: Droplet, footprints: Footprints, moon: Moon, apple: Apple, brain: Brain, stethoscope: Stethoscope, sparkles: Sparkles };
const CATEGORY_LABEL = {
  hydration: 'Hydration',
  nutrition: 'Nutrition',
  movement: 'Movement',
  sleep: 'Sleep',
  mental_health: 'Mind',
  preventive_care: 'Preventive care',
};

export function HealthTipCard() {
  const [tip, setTip] = useState(undefined);

  useEffect(() => {
    wellnessApi
      .getTodayTip()
      .then((res) => setTip(res.data.tip))
      .catch(() => setTip(null));
  }, []);

  if (tip === undefined) return <Skeleton className="h-32 w-full" />;
  if (!tip) return null;

  const Icon = ICONS[tip.icon] || Sparkles;

  return (
    <Card className="relative overflow-hidden bg-phoenix-gradient-soft border border-teal-500/10">
      <div className="flex items-start gap-4">
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="rounded-2xl bg-white p-3 shadow-soft text-teal-600 shrink-0"
        >
          <Icon size={22} />
        </motion.span>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal">{CATEGORY_LABEL[tip.category] || 'Wellness'}</Badge>
            <span className="text-xs text-slate-600">Today's tip</span>
          </div>
          <h3 className="font-heading font-semibold text-charcoal">{tip.title}</h3>
          <p className="text-sm text-slate-600 mt-1">{tip.body}</p>
        </div>
      </div>
    </Card>
  );
}

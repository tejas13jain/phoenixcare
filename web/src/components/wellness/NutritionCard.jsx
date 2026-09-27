import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Dumbbell, Flame, Beef, Settings2, Utensils } from 'lucide-react';
import { Card, Button, Input, Badge, Skeleton } from '../ui/index.js';
import { wellnessApi, patientApi } from '../../api/pushApi.js';
import { extractErrorMessage } from '../../api/client.js';

const GOALS = [
  { value: 'weight_loss', label: 'Weight loss' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'muscle_gain', label: 'Muscle gain' },
];

export function NutritionCard() {
  const [nutrition, setNutrition] = useState(undefined);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ weight: '', fitnessGoal: 'maintenance', goesToGym: false });
  const [saving, setSaving] = useState(false);

  const load = () => {
    wellnessApi
      .getNutrition()
      .then((res) => {
        setNutrition(res.data.nutrition);
        setForm({
          weight: res.data.profile.weight || '',
          fitnessGoal: res.data.profile.fitnessGoal || 'maintenance',
          goesToGym: !!res.data.profile.goesToGym,
        });
        if (res.data.nutrition.needsWeight) setEditing(true);
      })
      .catch(() => setNutrition(null));
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patientApi.updateMyProfile({
        weight: Number(form.weight),
        fitnessGoal: form.fitnessGoal,
        goesToGym: form.goesToGym,
      });
      toast.success('Nutrition profile updated');
      setEditing(false);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (nutrition === undefined) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-charcoal flex items-center gap-2">
          <Dumbbell size={18} className="text-sunrise-500" /> Nutrition for your goals
        </h3>
        <button onClick={() => setEditing((v) => !v)} className="text-slate-600 hover:text-teal-600">
          <Settings2 size={18} />
        </button>
      </div>

      {editing || !nutrition || nutrition.needsWeight ? (
        <form onSubmit={save} className="space-y-4">
          {nutrition?.needsWeight && (
            <p className="text-sm text-slate-600">Tell us a bit about you to get personalized suggestions.</p>
          )}
          <Input
            label="Weight (kg)"
            type="number"
            min={20}
            max={250}
            value={form.weight}
            onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
            required
          />
          <div>
            <label className="block mb-1.5 text-sm font-medium text-charcoal">Goal</label>
            <div className="flex gap-2">
              {GOALS.map((g) => (
                <button
                  type="button"
                  key={g.value}
                  onClick={() => setForm((f) => ({ ...f, fitnessGoal: g.value }))}
                  className={`flex-1 rounded-xl py-2 text-xs font-medium ${
                    form.fitnessGoal === g.value ? 'bg-phoenix-gradient text-white' : 'bg-slate-600/10 text-slate-600'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={form.goesToGym}
              onChange={(e) => setForm((f) => ({ ...f, goesToGym: e.target.checked }))}
              className="h-4 w-4 rounded accent-teal-600"
            />
            I work out at the gym
          </label>
          <Button type="submit" size="sm" loading={saving} className="w-full">
            Save
          </Button>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatPill icon={Flame} label="Daily calories" value={`${nutrition.calorieTarget}`} unit="kcal" color="sunrise" />
            <StatPill icon={Beef} label="Protein target" value={`${nutrition.proteinTargetG}`} unit="g" color="teal" />
          </div>

          <p className="text-xs font-semibold text-charcoal mb-2 flex items-center gap-1.5">
            <Utensils size={14} /> Suggested foods
          </p>
          <div className="space-y-2 mb-3">
            {nutrition.foods.map((food, i) => (
              <motion.div
                key={food.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between rounded-xl bg-slate-600/5 px-3 py-2"
              >
                <span className="text-sm text-charcoal">{food.name}</span>
                <div className="flex gap-1.5 shrink-0">
                  <Badge variant="teal">{food.proteinG}g protein</Badge>
                  <Badge variant="neutral">{food.calories} kcal</Badge>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-[11px] text-slate-600">{nutrition.disclaimer}</p>
        </>
      )}
    </Card>
  );
}

function StatPill({ icon: Icon, label, value, unit, color }) {
  const colorClass = color === 'sunrise' ? 'text-sunrise-500 bg-sunrise-50' : 'text-teal-600 bg-teal-50';
  return (
    <div className={`rounded-2xl p-4 ${colorClass}`}>
      <Icon size={18} />
      <p className="mt-2 font-heading font-bold text-xl">
        {value}
        <span className="text-xs font-medium ml-1">{unit}</span>
      </p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}

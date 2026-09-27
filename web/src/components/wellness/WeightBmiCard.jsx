import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Scale } from 'lucide-react';
import { Card, Input, Button, Badge, Skeleton } from '../ui/index.js';
import { wellnessApi, patientApi } from '../../api/pushApi.js';
import { extractErrorMessage } from '../../api/client.js';

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', variant: 'warning' };
  if (bmi < 25) return { label: 'Healthy range', variant: 'success' };
  if (bmi < 30) return { label: 'Overweight', variant: 'warning' };
  return { label: 'Obese', variant: 'error' };
}

export function WeightBmiCard({ onXpAwarded }) {
  const [data, setData] = useState(undefined);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    wellnessApi
      .getWeightHistory()
      .then((res) => {
        setData(res.data);
        setWeight(res.data.currentWeight || '');
      })
      .catch(() => setData(null));
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (height && Number(height) !== data.height) {
        await patientApi.updateMyProfile({ height: Number(height) });
      }
      const res = await wellnessApi.logWeight(Number(weight));
      toast.success('Weight logged');
      if (res.data.xpAwarded > 0) onXpAwarded?.();
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (data === undefined) return <Skeleton className="h-40 w-full" />;
  if (!data) return null;

  const category = data.bmi ? bmiCategory(data.bmi) : null;

  return (
    <Card>
      <h3 className="font-heading font-semibold text-charcoal flex items-center gap-2 mb-4">
        <Scale size={18} className="text-teal-600" /> Weight & BMI
      </h3>

      <form onSubmit={save} className="space-y-3 mb-4">
        <div className="flex gap-2">
          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="flex-1"
            required
          />
          {!data.height && (
            <Input
              label="Height (cm)"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="flex-1"
              required
            />
          )}
        </div>
        <Button type="submit" size="sm" loading={saving} className="w-full">
          Log today's weight
        </Button>
      </form>

      {data.bmi && (
        <div className="flex items-center gap-3 rounded-xl bg-slate-600/5 p-3">
          <div>
            <p className="font-heading font-bold text-lg text-charcoal">{data.bmi}</p>
            <p className="text-xs text-slate-600">BMI</p>
          </div>
          <Badge variant={category.variant}>{category.label}</Badge>
        </div>
      )}
    </Card>
  );
}

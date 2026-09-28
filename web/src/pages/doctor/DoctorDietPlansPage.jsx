import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Salad, Plus, Trash2, X, Pencil, Flame, Droplets } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Card, Button, Input, Badge, Modal, Skeleton } from '../../components/ui/index.js';
import { dietPlanApi } from '../../api/dietPlanApi.js';
import { doctorApi } from '../../api/doctorApi.js';
import { extractErrorMessage } from '../../api/client.js';

const GOALS = [
  { value: 'weight_loss', label: 'Weight loss' },
  { value: 'weight_gain', label: 'Weight gain' },
  { value: 'muscle_gain', label: 'Muscle gain' },
  { value: 'general_wellness', label: 'General wellness' },
  { value: 'diabetic_care', label: 'Diabetic care' },
  { value: 'heart_health', label: 'Heart health' },
];

const MEAL_TYPES = [
  { value: 'early_morning', label: 'Early morning' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'mid_morning', label: 'Mid-morning' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'evening_snack', label: 'Evening snack' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'bedtime', label: 'Bedtime' },
];

const emptyMeal = () => ({ mealType: 'breakfast', itemsText: '', calories: '', protein: '', notes: '' });

const emptyForm = () => ({
  patientId: '',
  title: '',
  goal: 'general_wellness',
  targetCalories: '',
  targetProtein: '',
  hydrationTarget: '',
  restrictionsText: '',
  notes: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  meals: [emptyMeal()],
});

export function DoctorDietPlansPage() {
  const [plans, setPlans] = useState(undefined);
  const [patients, setPatients] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    dietPlanApi
      .listMineAsDoctor()
      .then((res) => setPlans(res.data.dietPlans))
      .catch((err) => toast.error(extractErrorMessage(err)));
  };

  useEffect(() => {
    load();
    doctorApi
      .getMyPatients()
      .then((res) => setPatients(res.data.patients))
      .catch(() => setPatients([]));
  }, []);

  const patientOptions = useMemo(
    () => patients.map((p) => ({ id: p._id, name: p.user?.name || 'Patient' })),
    [patients]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (plan) => {
    setEditingId(plan._id);
    setForm({
      patientId: plan.patient?._id || plan.patient,
      title: plan.title,
      goal: plan.goal,
      targetCalories: plan.targetCalories ?? '',
      targetProtein: plan.targetProtein ?? '',
      hydrationTarget: plan.hydrationTarget || '',
      restrictionsText: (plan.restrictions || []).join(', '),
      notes: plan.notes || '',
      startDate: plan.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      endDate: plan.endDate?.slice(0, 10) || '',
      meals: plan.meals.map((m) => ({
        mealType: m.mealType,
        itemsText: m.items.join(', '),
        calories: m.calories ?? '',
        protein: m.protein ?? '',
        notes: m.notes || '',
      })),
    });
    setErrors({});
    setModalOpen(true);
  };

  const updateMeal = (index, key, value) => {
    setForm((f) => ({
      ...f,
      meals: f.meals.map((m, i) => (i === index ? { ...m, [key]: value } : m)),
    }));
  };

  const addMeal = () => setForm((f) => ({ ...f, meals: [...f.meals, emptyMeal()] }));
  const removeMeal = (index) => setForm((f) => ({ ...f, meals: f.meals.filter((_, i) => i !== index) }));

  const validate = () => {
    const next = {};
    if (!form.patientId) next.patientId = 'Select the patient this plan is for';
    if (!form.title || form.title.trim().length < 3) next.title = 'Title must be at least 3 characters';
    if (!form.startDate) next.startDate = 'Start date is required';
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      next.endDate = 'End date cannot be before the start date';
    }
    if (form.meals.length === 0) next.meals = 'Add at least one meal';
    form.meals.forEach((m, i) => {
      if (!m.itemsText.trim()) next[`meal-${i}`] = 'Add at least one food item';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        patientId: form.patientId,
        title: form.title.trim(),
        goal: form.goal,
        targetCalories: form.targetCalories ? Number(form.targetCalories) : undefined,
        targetProtein: form.targetProtein ? Number(form.targetProtein) : undefined,
        hydrationTarget: form.hydrationTarget || undefined,
        restrictions: form.restrictionsText
          ? form.restrictionsText.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        notes: form.notes || undefined,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        meals: form.meals.map((m) => ({
          mealType: m.mealType,
          items: m.itemsText.split(',').map((s) => s.trim()).filter(Boolean),
          calories: m.calories ? Number(m.calories) : undefined,
          protein: m.protein ? Number(m.protein) : undefined,
          notes: m.notes || undefined,
        })),
      };

      if (editingId) {
        await dietPlanApi.update(editingId, payload);
        toast.success('Diet plan updated');
      } else {
        await dietPlanApi.create(payload);
        toast.success('Diet plan created and shared with the patient');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this diet plan? The patient will no longer see it.')) return;
    try {
      await dietPlanApi.remove(id);
      setPlans((prev) => prev.filter((p) => p._id !== id));
      toast.success('Diet plan deleted');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-charcoal flex items-center gap-2">
              <Salad className="text-teal-600" /> Diet plans
            </h1>
            <p className="text-slate-600 text-sm">Build day-by-day meal plans for patients you've treated.</p>
          </div>
          <Button onClick={openCreate} disabled={patientOptions.length === 0}>
            <Plus size={16} /> New diet plan
          </Button>
        </div>

        {patientOptions.length === 0 && plans !== undefined && (
          <Card className="text-sm text-slate-600">
            You can create a diet plan once you have at least one confirmed or completed appointment with a patient.
          </Card>
        )}

        {plans === undefined ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : plans.length === 0 ? (
          <Card className="text-center py-14 text-slate-600">
            <p className="font-heading font-semibold text-charcoal mb-1">No diet plans yet</p>
            <p className="text-sm">Create one for a patient you've treated.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <Card key={plan._id} className="flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-heading font-semibold text-charcoal">{plan.title}</p>
                    <p className="text-xs text-slate-600">{plan.patient?.user?.name}</p>
                  </div>
                  <Badge variant={plan.isActive ? 'success' : 'neutral'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <Badge variant="teal" className="w-fit mb-3 capitalize">
                  {plan.goal.replace('_', ' ')}
                </Badge>
                <div className="flex items-center gap-4 text-xs text-slate-600 mb-3">
                  {plan.targetCalories && (
                    <span className="flex items-center gap-1">
                      <Flame size={13} className="text-sunrise-500" /> {plan.targetCalories} kcal/day
                    </span>
                  )}
                  {plan.hydrationTarget && (
                    <span className="flex items-center gap-1">
                      <Droplets size={13} className="text-sky-500" /> {plan.hydrationTarget}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mb-4">{plan.meals.length} meal(s) planned</p>
                <div className="mt-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(plan)} className="flex-1">
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(plan._id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit diet plan' : 'New diet plan'} className="max-w-2xl">
        <form onSubmit={submit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-charcoal">Patient</label>
            <select
              value={form.patientId}
              onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
              disabled={!!editingId}
              className="w-full rounded-xl border border-slate-600/20 px-3 py-2.5 text-sm bg-white disabled:bg-slate-600/5"
            >
              <option value="">Select a patient</option>
              {patientOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.patientId && <p className="mt-1 text-xs text-error">{errors.patientId}</p>}
          </div>

          <Input
            label="Plan title"
            placeholder="e.g. Heart-healthy 2-week plan"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={errors.title}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-charcoal">Goal</label>
              <select
                value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                className="w-full rounded-xl border border-slate-600/20 px-3 py-2.5 text-sm bg-white"
              >
                {GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Hydration target"
              placeholder="2.5L water/day"
              value={form.hydrationTarget}
              onChange={(e) => setForm((f) => ({ ...f, hydrationTarget: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target calories/day"
              type="number"
              min="0"
              value={form.targetCalories}
              onChange={(e) => setForm((f) => ({ ...f, targetCalories: e.target.value }))}
            />
            <Input
              label="Target protein (g/day)"
              type="number"
              min="0"
              value={form.targetProtein}
              onChange={(e) => setForm((f) => ({ ...f, targetProtein: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              error={errors.startDate}
            />
            <Input
              label="End date (optional)"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              error={errors.endDate}
            />
          </div>

          <Input
            label="Dietary restrictions (comma-separated)"
            placeholder="Low sodium, No fried food"
            value={form.restrictionsText}
            onChange={(e) => setForm((f) => ({ ...f, restrictionsText: e.target.value }))}
          />

          <div>
            <label className="block mb-1.5 text-sm font-medium text-charcoal">Notes for patient</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-xl border border-slate-600/20 px-3 py-2.5 text-sm bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-charcoal">Meals</label>
              <button type="button" onClick={addMeal} className="text-xs font-medium text-teal-600 flex items-center gap-1">
                <Plus size={14} /> Add meal
              </button>
            </div>
            {errors.meals && <p className="mb-2 text-xs text-error">{errors.meals}</p>}
            <div className="space-y-3">
              {form.meals.map((meal, i) => (
                <div key={i} className="rounded-xl border border-slate-600/15 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={meal.mealType}
                      onChange={(e) => updateMeal(i, 'mealType', e.target.value)}
                      className="rounded-lg border border-slate-600/20 px-2 py-1.5 text-xs bg-white"
                    >
                      {MEAL_TYPES.map((mt) => (
                        <option key={mt.value} value={mt.value}>
                          {mt.label}
                        </option>
                      ))}
                    </select>
                    {form.meals.length > 1 && (
                      <button type="button" onClick={() => removeMeal(i)} className="text-slate-600 hover:text-error">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    placeholder="Food items, comma-separated (e.g. Oats, Boiled eggs)"
                    value={meal.itemsText}
                    onChange={(e) => updateMeal(i, 'itemsText', e.target.value)}
                    className="w-full rounded-lg border border-slate-600/20 px-3 py-2 text-sm bg-white"
                  />
                  {errors[`meal-${i}`] && <p className="text-xs text-error">{errors[`meal-${i}`]}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Calories"
                      value={meal.calories}
                      onChange={(e) => updateMeal(i, 'calories', e.target.value)}
                      className="w-full rounded-lg border border-slate-600/20 px-3 py-2 text-sm bg-white"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Protein (g)"
                      value={meal.protein}
                      onChange={(e) => updateMeal(i, 'protein', e.target.value)}
                      className="w-full rounded-lg border border-slate-600/20 px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <input
                    placeholder="Notes (optional)"
                    value={meal.notes}
                    onChange={(e) => updateMeal(i, 'notes', e.target.value)}
                    className="w-full rounded-lg border border-slate-600/20 px-3 py-2 text-sm bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" loading={saving} className="w-full">
            {editingId ? 'Save changes' : 'Create & share with patient'}
          </Button>
        </form>
      </Modal>
    </PageTransition>
  );
}

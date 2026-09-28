import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Salad, Flame, Droplets, Ban, StickyNote } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Card, Badge, Skeleton } from '../../components/ui/index.js';
import { dietPlanApi } from '../../api/dietPlanApi.js';
import { extractErrorMessage } from '../../api/client.js';

const MEAL_LABELS = {
  early_morning: 'Early morning',
  breakfast: 'Breakfast',
  mid_morning: 'Mid-morning',
  lunch: 'Lunch',
  evening_snack: 'Evening snack',
  dinner: 'Dinner',
  bedtime: 'Bedtime',
};

export function MyDietPlansPage() {
  const [plans, setPlans] = useState(undefined);

  useEffect(() => {
    dietPlanApi
      .listMineAsPatient()
      .then((res) => setPlans(res.data.dietPlans))
      .catch((err) => toast.error(extractErrorMessage(err)));
  }, []);

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-charcoal flex items-center gap-2">
            <Salad className="text-teal-600" /> My diet plans
          </h1>
          <p className="text-slate-600 text-sm">Meal plans your doctors have shared with you.</p>
        </div>

        {plans === undefined ? (
          <Skeleton className="h-48 w-full" />
        ) : plans.length === 0 ? (
          <Card className="text-center py-14 text-slate-600">
            <p className="font-heading font-semibold text-charcoal mb-1">No diet plans yet</p>
            <p className="text-sm">Your doctor can create one for you after a consultation.</p>
          </Card>
        ) : (
          <div className="space-y-5">
            {plans.map((plan) => (
              <Card key={plan._id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-heading font-semibold text-lg text-charcoal">{plan.title}</p>
                    <p className="text-xs text-slate-600">
                      By {plan.doctor?.user?.name} · Since {new Date(plan.startDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <Badge variant={plan.isActive ? 'success' : 'neutral'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge variant="teal" className="capitalize">
                    {plan.goal.replace('_', ' ')}
                  </Badge>
                  {plan.targetCalories && (
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <Flame size={13} className="text-sunrise-500" /> {plan.targetCalories} kcal/day
                    </span>
                  )}
                  {plan.targetProtein && <span className="text-xs text-slate-600">{plan.targetProtein}g protein/day</span>}
                  {plan.hydrationTarget && (
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <Droplets size={13} className="text-sky-500" /> {plan.hydrationTarget}
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {plan.meals.map((meal, i) => (
                    <div key={i} className="rounded-xl bg-slate-600/5 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-charcoal">{MEAL_LABELS[meal.mealType] || meal.mealType}</p>
                        {(meal.calories || meal.protein) && (
                          <p className="text-xs text-slate-600">
                            {meal.calories ? `${meal.calories} kcal` : ''} {meal.protein ? `· ${meal.protein}g protein` : ''}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{meal.items.join(', ')}</p>
                      {meal.notes && <p className="text-xs text-slate-500 italic mt-1">{meal.notes}</p>}
                    </div>
                  ))}
                </div>

                {plan.restrictions?.length > 0 && (
                  <p className="flex items-start gap-1.5 text-xs text-slate-600 mb-2">
                    <Ban size={14} className="text-error shrink-0 mt-0.5" />
                    <span>
                      <strong>Avoid:</strong> {plan.restrictions.join(', ')}
                    </span>
                  </p>
                )}
                {plan.notes && (
                  <p className="flex items-start gap-1.5 text-xs text-slate-600">
                    <StickyNote size={14} className="text-teal-600 shrink-0 mt-0.5" />
                    <span>{plan.notes}</span>
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

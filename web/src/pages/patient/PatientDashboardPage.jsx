import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarClock, FolderHeart, Bell, Search } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Card, Button, Badge, Skeleton } from '../../components/ui/index.js';
import { appointmentApi } from '../../api/appointmentApi.js';
import { useAuthStore } from '../../store/slices/authStore.js';
import { extractErrorMessage } from '../../api/client.js';
import { getFirstName } from '../../utils/formatName.js';
import { HealthTipCard } from '../../components/wellness/HealthTipCard.jsx';
import { WaterTracker } from '../../components/wellness/WaterTracker.jsx';
import { ProgressWidget } from '../../components/wellness/ProgressWidget.jsx';
import { NutritionCard } from '../../components/wellness/NutritionCard.jsx';
import { SleepTracker } from '../../components/wellness/SleepTracker.jsx';
import { ActivityTracker } from '../../components/wellness/ActivityTracker.jsx';
import { WeightBmiCard } from '../../components/wellness/WeightBmiCard.jsx';
import { MedicationList } from '../../components/wellness/MedicationList.jsx';

const STATUS_VARIANT = {
  confirmed: 'teal',
  waiting_room: 'warning',
  in_progress: 'success',
  completed: 'neutral',
  cancelled: 'error',
  pending_payment: 'warning',
};

export function PatientDashboardPage() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);

  useEffect(() => {
    appointmentApi
      .listMine({ limit: 5 })
      .then((res) => setAppointments(res.data.appointments))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-charcoal">Hi {getFirstName(user?.name)},</h1>
          <p className="text-slate-600">Here's what's happening with your care.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <QuickLink to="/doctors" icon={Search} label="Find a doctor" />
          <QuickLink to="/patient/appointments" icon={CalendarClock} label="My appointments" />
          <QuickLink to="/patient/health-vault" icon={FolderHeart} label="Health vault" />
        </div>

        <ProgressWidget refreshKey={progressRefreshKey} />

        <div className="grid md:grid-cols-2 gap-4">
          <WaterTracker onXpAwarded={() => setProgressRefreshKey((k) => k + 1)} />
          <SleepTracker onXpAwarded={() => setProgressRefreshKey((k) => k + 1)} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <ActivityTracker onXpAwarded={() => setProgressRefreshKey((k) => k + 1)} />
          <HealthTipCard />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <WeightBmiCard onXpAwarded={() => setProgressRefreshKey((k) => k + 1)} />
          <MedicationList />
        </div>

        <NutritionCard />

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">Upcoming & recent appointments</h2>
            <Link to="/patient/appointments" className="text-sm text-teal-600 hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              <p className="mb-3">No appointments yet.</p>
              <Link to="/doctors">
                <Button>Book your first consultation</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div
                  key={appt._id}
                  className="flex items-center justify-between rounded-xl border border-slate-600/10 p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{appt.doctor?.user?.name}</p>
                    <p className="text-xs text-slate-600">
                      {appt.date} · {appt.startTime} · {appt.mode}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[appt.status] || 'neutral'}>{appt.status.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link to={to}>
      <Card hoverLift className="flex items-center gap-3">
        <span className="rounded-full bg-teal-50 p-3 text-teal-600">
          <Icon size={20} />
        </span>
        <span className="font-medium text-sm text-charcoal">{label}</span>
      </Card>
    </Link>
  );
}

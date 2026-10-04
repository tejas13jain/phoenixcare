import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarClock, Wallet, Star, Users } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Card, Badge, Button, Skeleton } from '../../components/ui/index.js';
import { appointmentApi } from '../../api/appointmentApi.js';
import { doctorApi } from '../../api/doctorApi.js';
import { extractErrorMessage } from '../../api/client.js';

const STATUS_VARIANT = {
  confirmed: 'teal',
  waiting_room: 'warning',
  in_progress: 'success',
  completed: 'neutral',
  cancelled: 'error',
};

export function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([appointmentApi.listMine({ limit: 20 }), doctorApi.getMyProfile()])
      .then(([apptRes, profileRes]) => {
        setAppointments(apptRes.data.appointments);
        setProfile(profileRes.data.doctor);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todaysAppointments = useMemo(() => appointments.filter((a) => a.date === today), [appointments, today]);
  const earningsThisBatch = useMemo(
    () => appointments.filter((a) => a.status === 'completed').reduce((sum, a) => sum + a.fee, 0),
    [appointments]
  );

  const handleJoin = async (appt) => {
    try {
      navigate(`/consultation/${appt._id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleCancel = async (appt) => {
    const reason = window.prompt('Reason for cancelling this appointment? (shown to the patient)') ?? null;
    if (reason === null) return;
    try {
      await appointmentApi.cancel(appt._id, reason);
      toast.success('Appointment cancelled and the patient has been notified');
      setAppointments((prev) => prev.map((a) => (a._id === appt._id ? { ...a, status: 'cancelled' } : a)));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {profile && profile.kycStatus !== 'verified' && (
          <Link
            to="/doctor/documents"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-orange-300 bg-orange-50 px-5 py-4 hover:bg-orange-100/70"
          >
            <span className="text-sm text-charcoal">
              <strong>Finish your verification.</strong>{' '}
              {profile.kycStatus === 'under_review'
                ? 'Our team is reviewing your documents. You can check their status here.'
                : 'Upload your documents so patients can find and book you.'}
            </span>
            <span className="text-sm font-semibold text-orange-600">Verification documents →</span>
          </Link>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl">Welcome back, {profile?.user?.name}</h1>
            <p className="text-slate-600">
              {profile?.kycStatus === 'verified' ? (
                <Badge variant="success">KYC verified</Badge>
              ) : (
                <Badge variant="warning">KYC {profile?.kycStatus}</Badge>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/doctor/analytics">
              <Button variant="outline">Analytics & reports</Button>
            </Link>
            <Link to="/doctor/availability">
              <Button variant="outline">Manage availability</Button>
            </Link>
            <Link to="/doctor/diet-plans">
              <Button variant="outline">Diet plans</Button>
            </Link>
            <Link to="/doctor/blogs">
              <Button variant="outline">Health blog</Button>
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard icon={CalendarClock} label="Today's appointments" value={todaysAppointments.length} />
          <StatCard icon={Wallet} label="Earnings (recent)" value={`₹${earningsThisBatch}`} />
          <StatCard icon={Star} label="Rating" value={profile?.rating?.toFixed(1) || '—'} />
          <StatCard icon={Users} label="Total consultations" value={profile?.totalConsultations || 0} />
        </div>

        <Card>
          <h2 className="font-heading font-semibold text-lg mb-4">Today's queue</h2>
          {todaysAppointments.length === 0 ? (
            <p className="text-sm text-slate-600">No appointments scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {todaysAppointments.map((appt) => (
                <div key={appt._id} className="flex items-center justify-between rounded-xl border border-slate-600/10 p-3">
                  <div>
                    <p className="font-medium text-sm">{appt.patient?.user?.name}</p>
                    <p className="text-xs text-slate-600">
                      {appt.startTime} · {appt.mode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[appt.status] || 'neutral'}>{appt.status.replace('_', ' ')}</Badge>
                    {['confirmed', 'waiting_room', 'in_progress'].includes(appt.status) && appt.mode !== 'in_clinic' && (
                      <Button size="sm" onClick={() => handleJoin(appt)}>
                        Start
                      </Button>
                    )}
                    {['pending_payment', 'confirmed', 'waiting_room'].includes(appt.status) && (
                      <Button size="sm" variant="danger" onClick={() => handleCancel(appt)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-heading font-semibold text-lg mb-4">All appointments</h2>
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div key={appt._id} className="flex items-center justify-between rounded-xl border border-slate-600/10 p-3">
                <div>
                  <p className="font-medium text-sm">{appt.patient?.user?.name}</p>
                  <p className="text-xs text-slate-600">
                    {appt.date} · {appt.startTime} · {appt.mode}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANT[appt.status] || 'neutral'}>{appt.status.replace('_', ' ')}</Badge>
                  {['pending_payment', 'confirmed', 'waiting_room'].includes(appt.status) && (
                    <Button size="sm" variant="danger" onClick={() => handleCancel(appt)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <TermsLink />
      </div>
    </PageTransition>
  );
}

function TermsLink() {
  return (
    <p className="mt-6 text-center text-xs text-slate-600">
      <Link to="/doctor/terms" className="underline hover:text-teal-600">
        PhoenixCare Doctor Terms &amp; Conditions
      </Link>
    </p>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-center gap-3">
      <span className="rounded-full bg-teal-50 p-3 text-teal-600">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs text-slate-600">{label}</p>
        <p className="font-heading font-bold text-lg">{value}</p>
      </div>
    </Card>
  );
}

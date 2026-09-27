import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Card, Badge, Button, Skeleton } from '../../components/ui/index.js';
import { appointmentApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';

const TABS = [
  { key: '', label: 'All' },
  { key: 'confirmed', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_VARIANT = {
  confirmed: 'teal',
  waiting_room: 'warning',
  in_progress: 'success',
  completed: 'neutral',
  cancelled: 'error',
  pending_payment: 'warning',
};

export function PatientAppointmentsPage() {
  const [tab, setTab] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    appointmentApi
      .listMine(tab ? { status: tab } : {})
      .then((res) => setAppointments(res.data.appointments))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [tab]);

  const handleCancel = async (id) => {
    try {
      await appointmentApi.cancel(id, 'Cancelled by patient');
      toast.success('Appointment cancelled');
      setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status: 'cancelled' } : a)));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleJoin = async (appt) => {
    try {
      if (appt.status === 'confirmed') await appointmentApi.enterWaitingRoom(appt._id);
      navigate(`/consultation/${appt._id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading font-bold text-2xl mb-6">My appointments</h1>

        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                tab === t.key ? 'bg-phoenix-gradient text-white' : 'bg-slate-600/10 text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <Card className="text-center py-12 text-slate-600">No appointments in this category.</Card>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <Card key={appt._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-heading font-semibold">{appt.doctor?.user?.name}</p>
                  <p className="text-sm text-slate-600">
                    {appt.date} · {appt.startTime} · {appt.mode}
                  </p>
                  <Badge variant={STATUS_VARIANT[appt.status] || 'neutral'} className="mt-1">
                    {appt.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {['confirmed', 'waiting_room', 'in_progress'].includes(appt.status) && appt.mode !== 'in_clinic' && (
                    <Button size="sm" onClick={() => handleJoin(appt)}>
                      Join
                    </Button>
                  )}
                  {appt.status === 'completed' && appt.prescription && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/prescriptions/${appt._id}`)}>
                      View Rx
                    </Button>
                  )}
                  {['pending_payment', 'confirmed'].includes(appt.status) && (
                    <Button size="sm" variant="danger" onClick={() => handleCancel(appt._id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

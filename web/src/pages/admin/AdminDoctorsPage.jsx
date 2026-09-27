import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Skeleton } from '../../components/ui/index.js';
import { adminApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';

export function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi
      .pendingDoctors()
      .then((res) => setDoctors(res.data.doctors))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleReview = async (id, status) => {
    const reason = status === 'rejected' ? window.prompt('Reason for rejection?') || '' : undefined;
    try {
      await adminApi.reviewKyc(id, { status, reason });
      toast.success(`Doctor ${status}`);
      setDoctors((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-semibold text-lg">Pending KYC verification</h2>
      {doctors.length === 0 ? (
        <Card className="text-center py-10 text-slate-600">No doctors awaiting verification.</Card>
      ) : (
        doctors.map((doctor) => (
          <Card key={doctor._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-heading font-semibold">{doctor.user?.name}</p>
              <p className="text-sm text-slate-600">
                {doctor.user?.email} · {doctor.user?.phone}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Reg. No: {doctor.registrationNumber} · Specialties: {doctor.specialties?.join(', ') || '—'}
              </p>
              <Badge variant="warning" className="mt-1">
                {doctor.kycStatus.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="danger" onClick={() => handleReview(doctor._id, 'rejected')}>
                Reject
              </Button>
              <Button size="sm" onClick={() => handleReview(doctor._id, 'verified')}>
                Verify
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

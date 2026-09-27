import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { Users, Stethoscope, ShieldCheck, IndianRupee } from 'lucide-react';
import { Card, Skeleton } from '../../components/ui/index.js';
import { adminApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .analyticsOverview()
      .then((res) => setData(res.data))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!data) return null;

  const funnel = data.statusFunnel.map((f) => ({ status: f._id.replace('_', ' '), count: f.count }));

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Patients" value={data.totals.totalPatients} />
        <StatCard icon={Stethoscope} label="Doctors" value={data.totals.totalDoctorAccounts} />
        <StatCard icon={ShieldCheck} label="Verified doctors" value={data.totals.verifiedDoctors} />
        <StatCard icon={IndianRupee} label="Revenue (30d)" value={`₹${data.revenue.totalRevenue || 0}`} />
      </div>

      <Card>
        <h2 className="font-heading font-semibold mb-4">Consultations per day (last 30 days)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.consultationsPerDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#44586622" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0F6E6A" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-heading font-semibold mb-4">Top doctors by consultations</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.topDoctors}>
              <CartesianGrid strokeDasharray="3 3" stroke="#44586622" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="consultations" fill="#2C8FEA" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="font-heading font-semibold mb-4">Appointment status funnel</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#44586622" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#FF6B35" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
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

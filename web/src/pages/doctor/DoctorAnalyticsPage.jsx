import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Star, Wallet, Users, FileSpreadsheet } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Card, Button, Skeleton } from '../../components/ui/index.js';
import { doctorReportApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { downloadBlob } from '../../utils/downloadFile.js';

const MODE_COLORS = { video: '#0F6E6A', audio: '#2C8FEA', chat: '#FF6B35', in_clinic: '#F5B914' };

export function DoctorAnalyticsPage() {
  const [data, setData] = useState(undefined);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    doctorReportApi
      .getMyAnalytics()
      .then((res) => setData(res.data))
      .catch((err) => toast.error(extractErrorMessage(err)));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await doctorReportApi.exportMyReport();
      downloadBlob(blob, `phoenixcare-my-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  if (data === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const modePie = data.modeBreakdown.map((m) => ({ name: m._id, value: m.count }));

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-bold text-2xl">My analytics & reports</h1>
          <Button loading={exporting} onClick={handleExport}>
            <FileSpreadsheet size={16} className="mr-1.5" /> Download full report (Excel)
          </Button>
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total consultations" value={data.totalConsultations} />
          <StatCard icon={Wallet} label="Total earnings" value={`₹${data.earnings.totalEarnings}`} />
          <StatCard icon={Star} label="Rating" value={`${data.rating?.toFixed(1) || '—'} (${data.ratingCount})`} />
          <StatCard icon={Wallet} label="Collected (30d)" value={`₹${data.earnings.totalCollected}`} />
        </div>

        <Card>
          <h2 className="font-heading font-semibold mb-4">Consultations per day (last 30 days)</h2>
          <ResponsiveContainer width="100%" height={240}>
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
            <h2 className="font-heading font-semibold mb-4">Consultations by mode</h2>
            {modePie.length === 0 ? (
              <p className="text-sm text-slate-600">No consultations yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={modePie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {modePie.map((entry) => (
                      <Cell key={entry.name} fill={MODE_COLORS[entry.name] || '#8a97a0'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <h2 className="font-heading font-semibold mb-4">Appointment status breakdown</h2>
            <div className="space-y-2">
              {data.statusFunnel.map((s) => (
                <div key={s._id} className="flex items-center justify-between rounded-xl bg-slate-600/5 px-3 py-2">
                  <span className="text-sm capitalize text-charcoal">{s._id.replace('_', ' ')}</span>
                  <span className="font-semibold text-teal-700">{s.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
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

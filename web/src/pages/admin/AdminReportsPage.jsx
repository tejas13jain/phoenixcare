import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Card, Button, Badge, Skeleton, Input } from '../../components/ui/index.js';
import { adminApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { downloadBlob } from '../../utils/downloadFile.js';

const STATUS_VARIANT = {
  confirmed: 'teal',
  waiting_room: 'warning',
  in_progress: 'success',
  completed: 'neutral',
  cancelled: 'error',
  pending_payment: 'warning',
};

const STATUSES = ['', 'pending_payment', 'confirmed', 'waiting_room', 'in_progress', 'completed', 'cancelled', 'no_show'];
const MODES = ['', 'video', 'audio', 'chat', 'in_clinic'];

export function AdminReportsPage() {
  const [appointments, setAppointments] = useState(undefined);
  const [filters, setFilters] = useState({ status: '', mode: '', from: '', to: '' });
  const [exportingAppointments, setExportingAppointments] = useState(false);
  const [exportingPayments, setExportingPayments] = useState(false);

  const load = () => {
    setAppointments(undefined);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    adminApi
      .listAppointments({ ...params, limit: 20 })
      .then((res) => setAppointments(res.data.appointments))
      .catch((err) => toast.error(extractErrorMessage(err)));
  };

  useEffect(load, []);

  const exportAppointments = async () => {
    setExportingAppointments(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const blob = await adminApi.exportAppointments(params);
      downloadBlob(blob, `phoenixcare-appointments-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Appointments report downloaded');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setExportingAppointments(false);
    }
  };

  const exportPayments = async () => {
    setExportingPayments(true);
    try {
      const blob = await adminApi.exportPayments({});
      downloadBlob(blob, `phoenixcare-payments-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Payments report downloaded');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setExportingPayments(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading font-semibold text-lg">Appointments report</h2>
        <Button size="sm" loading={exportingAppointments} onClick={exportAppointments}>
          <FileSpreadsheet size={16} className="mr-1.5" /> Download Excel
        </Button>
      </div>

      <Card>
        <div className="grid sm:grid-cols-4 gap-3 mb-4">
          <Input
            label="From"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
          <Input
            label="To"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
          <div>
            <label className="block mb-1.5 text-sm font-medium text-charcoal">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-xl border border-slate-600/20 px-3 py-2.5 text-sm bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s ? s.replace('_', ' ') : 'All statuses'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium text-charcoal">Mode</label>
            <select
              value={filters.mode}
              onChange={(e) => setFilters((f) => ({ ...f, mode: e.target.value }))}
              className="w-full rounded-xl border border-slate-600/20 px-3 py-2.5 text-sm bg-white"
            >
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {m ? m.replace('_', ' ') : 'All modes'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={load}>
          Apply filters
        </Button>
      </Card>

      {appointments === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : appointments.length === 0 ? (
        <Card className="text-center py-10 text-slate-600">No appointments match these filters.</Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-2xl shadow-soft overflow-hidden">
            <thead className="bg-slate-600/5 text-left text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id} className="border-t border-slate-600/10">
                  <td className="px-4 py-3">
                    {a.date} · {a.startTime}
                  </td>
                  <td className="px-4 py-3">{a.patient?.user?.name}</td>
                  <td className="px-4 py-3">{a.doctor?.user?.name}</td>
                  <td className="px-4 py-3 capitalize">{a.mode.replace('_', ' ')}</td>
                  <td className="px-4 py-3">₹{a.fee}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[a.status] || 'neutral'}>{a.status.replace('_', ' ')}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-600 mt-2">Showing the most recent 20 — download the Excel report for the full dataset.</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-600/10">
        <div>
          <h2 className="font-heading font-semibold text-lg">Payments & commission report</h2>
          <p className="text-sm text-slate-600">Full transaction history with commission/payout breakdown.</p>
        </div>
        <Button size="sm" variant="outline" loading={exportingPayments} onClick={exportPayments}>
          <Download size={16} className="mr-1.5" /> Download Excel
        </Button>
      </div>
    </div>
  );
}

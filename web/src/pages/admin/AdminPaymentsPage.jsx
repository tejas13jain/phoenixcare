import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileSpreadsheet } from 'lucide-react';
import { Card, Badge, Skeleton, Button } from '../../components/ui/index.js';
import { adminApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { downloadBlob } from '../../utils/downloadFile.js';

const STATUS_VARIANT = { paid: 'success', created: 'warning', failed: 'error', refunded: 'neutral' };
const PAYOUT_VARIANT = { pending: 'warning', processing: 'teal', paid: 'success' };

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    adminApi
      .listPayments()
      .then((res) => setPayments(res.data.payments))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const cyclePayout = async (payment) => {
    const order = ['pending', 'processing', 'paid'];
    const next = order[(order.indexOf(payment.payoutStatus) + 1) % order.length];
    try {
      await adminApi.updatePayout(payment._id, next);
      setPayments((prev) => prev.map((p) => (p._id === payment._id ? { ...p, payoutStatus: next } : p)));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const exportPayments = async () => {
    setExporting(true);
    try {
      const blob = await adminApi.exportPayments({});
      downloadBlob(blob, `phoenixcare-payments-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Payments report downloaded');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  const totalRevenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalCommission = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.commissionAmount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" loading={exporting} onClick={exportPayments}>
          <FileSpreadsheet size={16} className="mr-1.5" /> Download Excel
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <p className="text-xs text-slate-600">Total collected</p>
          <p className="font-heading font-bold text-xl">₹{totalRevenue}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-600">Platform commission</p>
          <p className="font-heading font-bold text-xl">₹{totalCommission}</p>
        </Card>
      </div>

      <div className="space-y-2">
        {payments.map((p) => (
          <Card key={p._id} className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium text-sm">{p.appointment?.doctor?.user?.name || 'Doctor'}</p>
              <p className="text-xs text-slate-600">
                ₹{p.amount} · commission ₹{p.commissionAmount} · payout ₹{p.doctorPayoutAmount}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
              <button onClick={() => cyclePayout(p)}>
                <Badge variant={PAYOUT_VARIANT[p.payoutStatus]}>payout: {p.payoutStatus}</Badge>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

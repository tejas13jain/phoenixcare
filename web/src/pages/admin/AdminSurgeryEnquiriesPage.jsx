import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Phone, MapPin } from 'lucide-react';
import { Card, Badge, Skeleton } from '../../components/ui/index.js';
import { surgeryApi } from '../../api/surgeryApi.js';
import { extractErrorMessage } from '../../api/client.js';

const STATUSES = ['new', 'contacted', 'scheduled', 'closed'];
const STATUS_BADGE = { new: 'sunrise', contacted: 'teal', scheduled: 'success', closed: 'neutral' };

export function AdminSurgeryEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    surgeryApi
      .listEnquiries(filter ? { status: filter } : {})
      .then((res) => setEnquiries(res.data.enquiries))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleStatus = async (id, status) => {
    try {
      await surgeryApi.updateEnquiryStatus(id, status);
      setEnquiries((prev) =>
        filter && status !== filter ? prev.filter((e) => e._id !== id) : prev.map((e) => (e._id === id ? { ...e, status } : e))
      );
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-heading font-semibold text-lg">Surgery callback requests</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-slate-600/20 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : enquiries.length === 0 ? (
        <Card className="text-center py-10 text-slate-600">No surgery requests yet.</Card>
      ) : (
        <div className="space-y-2">
          {enquiries.map((e) => (
            <Card key={e._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{e.name}</p>
                  <Badge variant={STATUS_BADGE[e.status]} className="capitalize">
                    {e.status}
                  </Badge>
                  {e.user && <Badge variant="teal">Registered patient</Badge>}
                </div>
                <p className="text-sm text-charcoal mt-1">{e.procedure}</p>
                <p className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1 hover:text-teal-600">
                    <Phone size={12} /> {e.phone}
                  </a>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {e.city}
                  </span>
                  <span>{new Date(e.createdAt).toLocaleString()}</span>
                </p>
                {e.notes && <p className="text-xs text-slate-600 mt-1 italic">“{e.notes}”</p>}
              </div>
              <select
                value={e.status}
                onChange={(ev) => handleStatus(e._id, ev.target.value)}
                aria-label={`Status for ${e.name}`}
                className="shrink-0 rounded-xl border border-slate-600/20 bg-white px-3 py-2 text-sm capitalize"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

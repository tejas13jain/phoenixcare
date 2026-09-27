import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Skeleton, Input } from '../../components/ui/index.js';
import { adminApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';

export function AdminModerationPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState({ title: '', body: '', segment: 'all' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    adminApi
      .flaggedReviews()
      .then((res) => setReviews(res.data.reviews))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleModerate = async (id, isHidden) => {
    try {
      await adminApi.moderateReview(id, isHidden);
      setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, isHidden } : r)));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const sendCampaign = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await adminApi.sendCampaign(campaign);
      toast.success(res.message);
      setCampaign({ title: '', body: '', segment: 'all' });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading font-semibold text-lg mb-4">Flagged & low-rated reviews</h2>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : reviews.length === 0 ? (
          <Card className="text-center py-10 text-slate-600">Nothing needs moderation right now.</Card>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <Card key={r._id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {r.patient?.user?.name} → {r.doctor?.user?.name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {'★'.repeat(r.rating)} · {r.comment}
                  </p>
                  <Badge variant={r.isHidden ? 'error' : 'success'}>{r.isHidden ? 'Hidden' : 'Visible'}</Badge>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleModerate(r._id, !r.isHidden)}>
                  {r.isHidden ? 'Unhide' : 'Hide'}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-heading font-semibold text-lg mb-4">Send a campaign notification</h2>
        <Card>
          <form onSubmit={sendCampaign} className="space-y-4">
            <Input
              label="Title"
              value={campaign.title}
              onChange={(e) => setCampaign((c) => ({ ...c, title: e.target.value }))}
              required
            />
            <div>
              <label className="block mb-1.5 text-sm font-medium text-charcoal">Message</label>
              <textarea
                className="w-full rounded-xl border border-slate-600/20 px-4 py-2.5 text-sm"
                rows={3}
                value={campaign.body}
                onChange={(e) => setCampaign((c) => ({ ...c, body: e.target.value }))}
                required
              />
            </div>
            <select
              value={campaign.segment}
              onChange={(e) => setCampaign((c) => ({ ...c, segment: e.target.value }))}
              className="w-full rounded-xl border border-slate-600/20 px-3 py-2.5 text-sm bg-white"
            >
              <option value="all">All users</option>
              <option value="patients">Patients only</option>
              <option value="doctors">Doctors only</option>
            </select>
            <Button type="submit" loading={sending}>
              Send campaign
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

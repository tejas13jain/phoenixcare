import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, Clock, Eye, FileCheck2, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Badge, Button, Skeleton } from '../ui/index.js';
import { adminApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { formatFileSize } from '../../constants/kycDocuments.js';
import { openBlobInNewTab } from '../../utils/fileHelpers.js';

const STATUS = {
  approved: { label: 'Approved', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Awaiting review', variant: 'warning', icon: Clock },
  rejected: { label: 'Rejected', variant: 'error', icon: AlertTriangle },
};

// Admin review of one doctor's verification documents. A doctor can be verified only when every
// required document is approved — the server enforces it; the button here just mirrors it.
export function DoctorDocumentsReview({ doctorId, onChanged, onClose }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  const load = () =>
    adminApi
      .getDoctorDocuments(doctorId)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(extractErrorMessage(err)));

  useEffect(() => {
    load();
  }, [doctorId]);

  const review = async (type, status, why) => {
    setBusy(type);
    try {
      const res = await adminApi.reviewDocument(doctorId, type, { status, ...(why && { reason: why }) });
      setData((d) => ({ ...d, ...res.data }));
      setRejecting(null);
      setReason('');
      onChanged?.();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    setBusy('verify');
    try {
      await adminApi.reviewKyc(doctorId, { status: 'verified' });
      toast.success('Doctor verified — now visible to patients');
      onChanged?.();
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const view = (type) =>
    openBlobInNewTab(() => adminApi.getDoctorDocumentBlob(doctorId, type)).catch(() => toast.error('Could not open that document.'));

  if (!data) return <Skeleton className="h-64 w-full" />;

  const verified = data.kycStatus === 'verified';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-slate-600">
          {data.doctor.name} · Reg. {data.doctor.registrationNumber}
        </p>
        <p className="font-medium text-charcoal">
          {data.requiredApproved} of {data.requiredTotal} required documents approved
        </p>
      </div>
      <p className="rounded-xl bg-cyan-50 px-3 py-2 text-xs text-charcoal">
        Check each document against the doctor’s profile — name, registration number and photo must match. Every view is logged.
      </p>

      <div className="space-y-3">
        {data.requirements.map((req) => {
          const doc = req.document;
          const status = doc ? STATUS[doc.status] : null;
          return (
            <div key={req.type} className="rounded-xl border border-slate-600/15 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-charcoal text-sm">{req.label}</p>
                    <Badge variant={req.required ? 'sunrise' : 'neutral'}>{req.required ? 'Required' : 'Optional'}</Badge>
                    {status ? (
                      <Badge variant={status.variant}>
                        <status.icon size={12} /> {status.label}
                      </Badge>
                    ) : (
                      <Badge>Not uploaded</Badge>
                    )}
                  </div>
                  {doc && (
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <FileCheck2 size={12} /> {doc.originalName}
                      </span>
                      <span>{formatFileSize(doc.size)}</span>
                      <span>Uploaded {new Date(doc.uploadedAt).toLocaleString()}</span>
                    </p>
                  )}
                  {doc?.status === 'rejected' && <p className="mt-1 text-xs text-error">Reason sent to doctor: {doc.rejectionReason}</p>}
                </div>

                {doc && (
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => view(req.type)}>
                      <Eye size={14} /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={doc.status === 'approved' || busy === req.type}
                      onClick={() => review(req.type, 'approved')}
                    >
                      <ThumbsUp size={14} /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy === req.type}
                      onClick={() => {
                        setRejecting(rejecting === req.type ? null : req.type);
                        setReason('');
                      }}
                    >
                      <ThumbsDown size={14} /> Reject
                    </Button>
                  </div>
                )}
              </div>

              {rejecting === req.type && (
                <form
                  className="mt-3 flex flex-col sm:flex-row gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    review(req.type, 'rejected', reason.trim());
                  }}
                >
                  <input
                    autoFocus
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={300}
                    placeholder="Why? The doctor will read this — e.g. “The photo is blurry”"
                    className="flex-1 rounded-xl border border-slate-600/20 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-error/30"
                    aria-label="Reason for rejecting this document"
                  />
                  <Button type="submit" size="sm" variant="danger" disabled={reason.trim().length < 3} loading={busy === req.type}>
                    Reject & email doctor
                  </Button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-600/10 pt-4">
        <p className="text-xs text-slate-600">
          {verified
            ? 'This doctor is verified and visible to patients.'
            : data.allApproved
              ? 'All required documents are approved — you can verify this doctor.'
              : 'Approve every required document to enable verification.'}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {!verified && (
            <Button onClick={verify} disabled={!data.allApproved} loading={busy === 'verify'}>
              <ShieldCheck size={16} /> Verify doctor
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

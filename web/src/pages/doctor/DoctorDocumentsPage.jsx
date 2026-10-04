import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, Clock, Eye, FileCheck2, Lock, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { PageTransition } from '../../components/layout/PageTransition.jsx';
import { Badge, Button, Card, Skeleton } from '../../components/ui/index.js';
import { doctorApi } from '../../api/doctorApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { formatFileSize } from '../../constants/kycDocuments.js';
import { compressImage, openBlobInNewTab } from '../../utils/fileHelpers.js';
import { clearDocumentsOk } from '../../components/layout/doctorTermsGate.js';

const MAX_BYTES = 4 * 1024 * 1024;

const STATUS = {
  approved: { label: 'Approved', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Waiting for review', variant: 'warning', icon: Clock },
  rejected: { label: 'Needs a new copy', variant: 'error', icon: AlertTriangle },
};

// Doctors upload the documents our team needs to verify them. Until the required ones are
// uploaded and approved, they stay hidden from patients.
export function DoctorDocumentsPage() {
  const [data, setData] = useState(null);
  const [busyType, setBusyType] = useState(null);
  const [progress, setProgress] = useState(0);

  const load = () =>
    doctorApi
      .getMyDocuments()
      .then((res) => setData(res.data))
      .catch((err) => toast.error(extractErrorMessage(err)));

  useEffect(() => {
    load();
  }, []);

  const handleFile = async (req, file) => {
    if (!file) return;
    if (req.imagesOnly && !/^image\/(jpeg|png)$/.test(file.type)) {
      toast.error('Please choose a JPG or PNG photo.');
      return;
    }
    if (!/^(application\/pdf|image\/(jpeg|png))$/.test(file.type)) {
      toast.error('Please upload a PDF, JPG or PNG file.');
      return;
    }

    setBusyType(req.type);
    setProgress(0);
    try {
      const ready = await compressImage(file);
      if (ready.size > MAX_BYTES) {
        toast.error(`That file is ${formatFileSize(ready.size)}. Please upload one under 4 MB.`);
        return;
      }
      const res = await doctorApi.uploadDocument(req.type, ready, setProgress);
      setData(res.data);
      clearDocumentsOk();
      toast.success(res.message);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setBusyType(null);
    }
  };

  const view = (type) =>
    openBlobInNewTab(() => doctorApi.getMyDocumentBlob(type)).catch(() => toast.error('Could not open that document.'));

  if (!data) {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageTransition>
    );
  }

  const { requirements, requiredTotal, requiredUploaded, kycStatus, kycRejectionReason, needsAction } = data;
  const verified = kycStatus === 'verified';
  const pct = Math.round((requiredUploaded / requiredTotal) * 100);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-cyan-50 via-sky-50 to-cyan-100/70 p-6 sm:p-8">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-700">
            <ShieldCheck size={14} /> Verification
          </p>
          <h1 className="mt-2 font-heading font-extrabold text-2xl sm:text-3xl text-charcoal">Verification documents</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Upload these documents so our team can verify you. Patients can find and book you only after your required documents are approved.
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-charcoal">
                {requiredUploaded} of {requiredTotal} required documents uploaded
              </span>
              <StatusPill kycStatus={kycStatus} needsAction={needsAction} />
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-white/80" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {verified && (
            <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-charcoal shadow-soft">
              <CheckCircle2 size={18} className="text-emerald-600" /> You’re verified and visible to patients.
              <Link to="/doctor/availability" className="font-medium text-teal-600 underline">
                Set your availability
              </Link>
            </p>
          )}
          {!verified && !needsAction && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-charcoal shadow-soft">
              <Clock size={18} className="text-amber-600" /> Everything is in. Our team is reviewing your documents — we’ll email you and notify you here.
            </p>
          )}
          {kycStatus === 'rejected' && kycRejectionReason && (
            <p className="mt-4 rounded-xl bg-error/10 px-4 py-2.5 text-sm text-error">Verification note: {kycRejectionReason}</p>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {requirements.map((req) => (
            <DocumentCard
              key={req.type}
              req={req}
              busy={busyType === req.type}
              progress={progress}
              disabled={!!busyType}
              onFile={(file) => handleFile(req, file)}
              onView={() => view(req.type)}
            />
          ))}
        </div>

        <Card className="mt-6 flex items-start gap-3 bg-cyan-50/60">
          <Lock size={18} className="mt-0.5 shrink-0 text-cyan-700" />
          <div className="text-sm text-charcoal">
            <p className="font-semibold">Your documents are private</p>
            <p className="mt-1 text-slate-600">
              They are stored securely and can be seen only by you and PhoenixCare’s verification team. They are used only to verify your
              identity and credentials, and are never shown to patients. Files must be PDF, JPG or PNG, up to 4 MB each.
            </p>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}

function StatusPill({ kycStatus, needsAction }) {
  if (kycStatus === 'verified') return <Badge variant="success">Verified</Badge>;
  if (kycStatus === 'under_review' && !needsAction) return <Badge variant="warning">Under review</Badge>;
  return <Badge variant="sunrise">Action needed</Badge>;
}

function DocumentCard({ req, busy, progress, disabled, onFile, onView }) {
  const inputRef = useRef(null);
  const doc = req.document;
  const status = doc ? STATUS[doc.status] : null;
  const accept = req.imagesOnly ? 'image/jpeg,image/png' : 'application/pdf,image/jpeg,image/png';

  return (
    <Card className={`${doc?.status === 'rejected' ? 'border border-error/40' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading font-semibold text-charcoal">{req.label}</h2>
            <Badge variant={req.required ? 'sunrise' : 'neutral'}>{req.required ? 'Required' : 'Optional'}</Badge>
            {status && (
              <Badge variant={status.variant}>
                <status.icon size={12} /> {status.label}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">{req.description}</p>

          {doc?.status === 'rejected' && (
            <p className="mt-2 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
              Our team couldn’t accept this: {doc.rejectionReason || 'please upload a clearer copy'}. Please upload a corrected copy.
            </p>
          )}

          {doc && (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1">
                <FileCheck2 size={13} /> {doc.originalName || 'Uploaded file'}
              </span>
              <span>{formatFileSize(doc.size)}</span>
              <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
            </p>
          )}

          {busy && (
            <div className="mt-3 h-1.5 w-full max-w-xs rounded-full bg-slate-600/10" aria-label="Upload progress">
              <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {doc && (
            <Button variant="ghost" size="sm" onClick={onView}>
              <Eye size={14} /> View
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="sr-only"
            aria-label={`${doc ? 'Replace' : 'Upload'} ${req.label}`}
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <Button
            size="sm"
            variant={doc && doc.status !== 'rejected' ? 'outline' : 'primary'}
            loading={busy}
            disabled={disabled && !busy}
            onClick={() => inputRef.current?.click()}
          >
            {doc ? <RefreshCw size={14} /> : <Upload size={14} />} {doc ? 'Replace' : 'Upload'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

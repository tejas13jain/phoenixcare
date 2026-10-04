import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Mail, Pencil, Plus, Search, Star, UserCheck } from 'lucide-react';
import { Card, Button, Badge, Skeleton, Modal } from '../../components/ui/index.js';
import { DoctorForm } from '../../components/admin/DoctorForm.jsx';
import { adminApi } from '../../api/appointmentApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { SPECIALTIES } from '../../constants/specialties.js';

const KYC_BADGE = { verified: 'success', under_review: 'warning', pending: 'warning', rejected: 'error' };
const PAGE_SIZE = 20;

export function AdminDoctorsPage() {
  const [tab, setTab] = useState('all');
  const [formDoctor, setFormDoctor] = useState(null); // null = closed, {} = new, doctor = edit
  const [credentials, setCredentials] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = (data) => {
    const wasNew = !formDoctor?._id;
    setFormDoctor(null);
    setRefreshKey((k) => k + 1);
    if (wasNew) {
      setCredentials({
        name: data.doctor.user.name,
        email: data.doctor.user.email,
        tempPassword: data.tempPassword,
        emailSent: data.emailSent,
        standardsEmailSent: data.standardsEmailSent,
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-slate-600/10 p-1">
          {[
            { key: 'all', label: 'All doctors' },
            { key: 'pending', label: 'Pending KYC' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t.key ? 'bg-white text-charcoal shadow-soft' : 'text-slate-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setFormDoctor({})}>
          <Plus size={16} /> Onboard doctor
        </Button>
      </div>

      {tab === 'all' ? (
        <AllDoctors refreshKey={refreshKey} onEdit={setFormDoctor} />
      ) : (
        <PendingKyc refreshKey={refreshKey} onEdit={setFormDoctor} />
      )}

      <Modal
        isOpen={!!formDoctor}
        onClose={() => setFormDoctor(null)}
        title={formDoctor?._id ? `Edit ${formDoctor.user?.name}` : 'Onboard a doctor'}
        className="!max-w-3xl max-h-[92vh] overflow-y-auto"
      >
        {formDoctor && <DoctorForm doctor={formDoctor._id ? formDoctor : null} onSaved={handleSaved} onCancel={() => setFormDoctor(null)} />}
      </Modal>

      <Modal isOpen={!!credentials} onClose={() => setCredentials(null)} title="Doctor onboarded">
        {credentials && <CredentialsNotice {...credentials} onDone={() => setCredentials(null)} />}
      </Modal>
    </div>
  );
}

function CredentialsNotice({ name, email, tempPassword, emailSent, standardsEmailSent, onDone }) {
  const copy = () => {
    navigator.clipboard
      ?.writeText(`PhoenixCare doctor login\nEmail: ${email}\nTemporary password: ${tempPassword}`)
      .then(() => toast.success('Copied'))
      .catch(() => toast.error('Couldn’t copy — select the text instead'));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-charcoal">
        <strong>{name}</strong> can now sign in.{' '}
        {emailSent
          ? 'We’ve emailed these details to them.'
          : 'The welcome email couldn’t be sent, so please share these details with the doctor securely.'}
      </p>
      <div className="rounded-xl border border-slate-600/15 bg-offwhite p-4 font-mono text-sm space-y-1">
        <p>Email: {email}</p>
        <p>
          Temporary password: <strong>{tempPassword}</strong>
        </p>
      </div>
      <p className="text-xs text-slate-600">This password is shown only once. The doctor can also sign in with a one-time code.</p>
      <p className="rounded-xl bg-cyan-50 px-3 py-2 text-xs text-charcoal">
        On first sign-in the doctor must read and accept the Doctor Terms &amp; Conditions.{' '}
        {standardsEmailSent
          ? 'We’ve also emailed them every standard that applies to practising on an Indian online portal.'
          : 'The standards email could not be sent — use “Email terms” on their row once email is working.'}
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={copy}>
          <Copy size={16} /> Copy details
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}

function AllDoctors({ refreshKey, onEdit }) {
  const [filters, setFilters] = useState({ q: '', specialty: '', city: '', kycStatus: '' });
  const [query, setQuery] = useState(filters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setResult(null);
    const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v));
    adminApi
      .searchDoctors({ ...params, page, limit: PAGE_SIZE })
      .then((res) => setResult(res.data))
      .catch((err) => {
        toast.error(extractErrorMessage(err));
        setResult({ doctors: [], pagination: { total: 0, totalPages: 0 } });
      });
  }, [query, page, refreshKey]);

  const submit = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(filters);
  };

  const quickUpdate = async (doctor, patch) => {
    try {
      const res = await adminApi.updateDoctor(doctor._id, patch);
      setResult((r) => ({ ...r, doctors: r.doctors.map((d) => (d._id === doctor._id ? { ...d, ...res.data.doctor } : d)) }));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const resendTerms = async (doctor) => {
    try {
      const res = await adminApi.resendStandardsEmail(doctor._id);
      toast.success(res.message);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <label className="flex items-center gap-2 rounded-xl border border-slate-600/20 bg-white px-3">
          <Search size={16} className="text-slate-600 shrink-0" />
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Name, email, phone, reg. no., qualification…"
            className="w-full py-2.5 text-sm outline-none bg-transparent"
          />
        </label>
        <select value={filters.specialty} onChange={(e) => setFilters((f) => ({ ...f, specialty: e.target.value }))} className="rounded-xl border border-slate-600/20 bg-white px-3 py-2.5 text-sm">
          <option value="">All specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          value={filters.city}
          onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
          placeholder="City"
          className="rounded-xl border border-slate-600/20 bg-white px-3 py-2.5 text-sm"
        />
        <select value={filters.kycStatus} onChange={(e) => setFilters((f) => ({ ...f, kycStatus: e.target.value }))} className="rounded-xl border border-slate-600/20 bg-white px-3 py-2.5 text-sm">
          <option value="">Any status</option>
          <option value="verified">Verified</option>
          <option value="under_review">Under review</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button type="submit">Search</Button>
      </form>

      {!result ? (
        <Skeleton className="h-64 w-full" />
      ) : result.doctors.length === 0 ? (
        <Card className="text-center py-10 text-slate-600">No doctors match these filters.</Card>
      ) : (
        <>
          <p className="text-sm text-slate-600">{result.pagination.total} doctor{result.pagination.total === 1 ? '' : 's'}</p>
          <div className="space-y-2">
            {result.doctors.map((d) => (
              <Card key={d._id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading font-semibold">{d.user?.name}</p>
                    <Badge variant={KYC_BADGE[d.kycStatus]} className="capitalize">
                      {d.kycStatus.replace('_', ' ')}
                    </Badge>
                    {d.isFeatured && (
                      <Badge variant="sunrise">
                        <Star size={12} /> Featured
                      </Badge>
                    )}
                    {d.termsAcceptance?.version ? (
                      <Badge variant="teal" title={`Accepted ${new Date(d.termsAcceptance.acceptedAt).toLocaleString()}`}>
                        Terms accepted
                      </Badge>
                    ) : (
                      <Badge variant="warning">Terms pending</Badge>
                    )}
                    {!d.isAcceptingNewPatients && <Badge>Not accepting patients</Badge>}
                    {d.user && !d.user.isActive && <Badge variant="error">Account deactivated</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {d.specialties?.join(', ') || 'No specialty yet'} · {d.experienceYears || 0} yrs{d.city ? ` · ${d.city}` : ''}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {d.user?.email} · {d.user?.phone} · Reg. {d.registrationNumber}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {d.kycStatus !== 'verified' && (
                    <Button size="sm" variant="secondary" onClick={() => quickUpdate(d, { kycStatus: 'verified' })}>
                      <UserCheck size={14} /> Verify
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => resendTerms(d)}>
                    <Mail size={14} /> Email terms
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => quickUpdate(d, { isFeatured: !d.isFeatured })}>
                    <Star size={14} /> {d.isFeatured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onEdit(d)}>
                    <Pencil size={14} /> Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          {result.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span>
                Page {page} of {result.pagination.totalPages}
              </span>
              <Button size="sm" variant="ghost" disabled={page >= result.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PendingKyc({ refreshKey, onEdit }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .pendingDoctors()
      .then((res) => setDoctors(res.data.doctors))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [refreshKey]);

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

  return doctors.length === 0 ? (
    <Card className="text-center py-10 text-slate-600">No doctors awaiting verification.</Card>
  ) : (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">
        Doctors who signed up themselves. Check their registration, complete their profile with “Edit” if needed, then verify.
      </p>
      {doctors.map((doctor) => (
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
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(doctor)}>
              <Pencil size={14} /> Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleReview(doctor._id, 'rejected')}>
              Reject
            </Button>
            <Button size="sm" onClick={() => handleReview(doctor._id, 'verified')}>
              Verify
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FlaskConical, Home, MapPin, Pencil, Phone, Plus, Search } from 'lucide-react';
import { Card, Button, Badge, Skeleton, Modal } from '../../components/ui/index.js';
import { LabForm } from '../../components/admin/LabForm.jsx';
import { adminLabApi } from '../../api/labApi.js';
import { extractErrorMessage } from '../../api/client.js';
import { LAB_ACCREDITATIONS, LAB_TEST_CATEGORIES } from '../../constants/labs.js';

const SELECT = 'rounded-xl border border-slate-600/20 bg-white px-3 py-2.5 text-sm';
const PAGE_SIZE = 20;

export function AdminLabsPage() {
  const [filters, setFilters] = useState({ q: '', city: '', category: '', status: '', accreditation: '', homeCollection: '' });
  const [query, setQuery] = useState(filters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [formLab, setFormLab] = useState(null); // null = closed, {} = new, lab = edit
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setResult(null);
    const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v));
    adminLabApi
      .list({ ...params, page, limit: PAGE_SIZE })
      .then((res) => setResult(res.data))
      .catch((err) => {
        toast.error(extractErrorMessage(err));
        setResult({ labs: [], pagination: { total: 0, totalPages: 0 } });
      });
  }, [query, page, refreshKey]);

  const submit = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(filters);
  };
  const setFilter = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  const toggleStatus = async (lab) => {
    try {
      const res = await adminLabApi.update(lab._id, { status: lab.status === 'active' ? 'inactive' : 'active' });
      setResult((r) => ({ ...r, labs: r.labs.map((l) => (l._id === lab._id ? { ...l, status: res.data.lab.status } : l)) }));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-semibold text-lg">Diagnostic labs</h2>
          <p className="text-sm text-slate-600">Onboard partner labs and manage the tests patients can find on PhoenixCare.</p>
        </div>
        <Button onClick={() => setFormLab({})}>
          <Plus size={16} /> Onboard lab
        </Button>
      </div>

      <form onSubmit={submit} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-slate-600/20 bg-white px-3">
            <Search size={16} className="text-slate-600 shrink-0" />
            <input
              value={filters.q}
              onChange={setFilter('q')}
              placeholder="Lab, test name, license no., contact, phone…"
              className="w-full py-2.5 text-sm outline-none bg-transparent"
            />
          </label>
          <input value={filters.city} onChange={setFilter('city')} placeholder="City" className={SELECT} />
          <Button type="submit">Search</Button>
        </div>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
          <select value={filters.category} onChange={setFilter('category')} className={SELECT} aria-label="Test category">
            <option value="">Any test category</option>
            {LAB_TEST_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <select value={filters.accreditation} onChange={setFilter('accreditation')} className={SELECT} aria-label="Accreditation">
            <option value="">Any accreditation</option>
            {LAB_ACCREDITATIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select value={filters.homeCollection} onChange={setFilter('homeCollection')} className={SELECT} aria-label="Home collection">
            <option value="">Home collection: any</option>
            <option value="true">Offers home collection</option>
            <option value="false">Walk-in only</option>
          </select>
          <select value={filters.status} onChange={setFilter('status')} className={SELECT} aria-label="Status">
            <option value="">Active & inactive</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </form>

      {!result ? (
        <Skeleton className="h-64 w-full" />
      ) : result.labs.length === 0 ? (
        <Card className="text-center py-12 text-slate-600">
          <FlaskConical className="mx-auto mb-3 text-slate-600/50" size={32} />
          No labs match these filters.
          <div className="mt-4">
            <Button size="sm" onClick={() => setFormLab({})}>
              <Plus size={14} /> Onboard your first lab
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-600">{result.pagination.total} lab{result.pagination.total === 1 ? '' : 's'}</p>
          <div className="space-y-2">
            {result.labs.map((lab) => (
              <Card key={lab._id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading font-semibold">{lab.name}</p>
                    <Badge variant={lab.status === 'active' ? 'success' : 'neutral'} className="capitalize">
                      {lab.status}
                    </Badge>
                    {lab.accreditations?.map((a) => (
                      <Badge key={a} variant="teal">
                        {a}
                      </Badge>
                    ))}
                    {lab.homeCollection && (
                      <Badge variant="sunrise">
                        <Home size={12} /> Home collection
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {lab.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone size={12} /> {lab.phone}
                    </span>
                    <span>License {lab.licenseNumber}</span>
                    {lab.contactPerson && <span>Contact: {lab.contactPerson}</span>}
                  </p>
                  <p className="text-sm text-charcoal mt-1">
                    {lab.tests.length} test{lab.tests.length === 1 ? '' : 's'}
                    {lab.matchedTests.length > 0 && (
                      <span className="text-teal-700"> · matches: {lab.matchedTests.map((t) => t.name).join(', ')}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => toggleStatus(lab)}>
                    {lab.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setFormLab(lab)}>
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

      <Modal
        isOpen={!!formLab}
        onClose={() => setFormLab(null)}
        title={formLab?._id ? `Edit ${formLab.name}` : 'Onboard a diagnostic lab'}
        className="!max-w-4xl max-h-[92vh] overflow-y-auto"
      >
        {formLab && (
          <LabForm
            lab={formLab._id ? formLab : null}
            onSaved={() => {
              setFormLab(null);
              setRefreshKey((k) => k + 1);
            }}
            onCancel={() => setFormLab(null)}
          />
        )}
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SlidersHorizontal } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { DoctorCard } from '../components/DoctorCard.jsx';
import { DoctorCardSkeleton, Button } from '../components/ui/index.js';
import { doctorApi } from '../api/doctorApi.js';
import { extractErrorMessage } from '../api/client.js';

const MODES = [
  { value: '', label: 'Any mode' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'chat', label: 'Chat' },
  { value: 'in_clinic', label: 'In-clinic' },
];

const SORTS = [
  { value: '', label: 'Recommended' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'fee_low', label: 'Fee: low to high' },
  { value: 'fee_high', label: 'Fee: high to low' },
  { value: 'experience', label: 'Most experienced' },
];

export function DoctorListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    q: searchParams.get('q') || '',
    specialty: searchParams.get('specialty') || '',
    mode: searchParams.get('mode') || '',
    sort: searchParams.get('sort') || '',
    page: Number(searchParams.get('page')) || 1,
  };

  useEffect(() => {
    doctorApi.specialties().then((res) => setSpecialties(res.data.specialties));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    doctorApi
      .list(params)
      .then((res) => {
        setDoctors(res.data.doctors);
        setPagination(res.data.pagination);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const goToPage = (page) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', page);
    setSearchParams(next);
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-2xl text-charcoal">Find your doctor</h1>
          <button
            className="md:hidden flex items-center gap-1 text-sm font-medium text-teal-600"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        <div className="grid md:grid-cols-[240px_1fr] gap-8">
          <aside className={`space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Specialty</h3>
              <select
                value={filters.specialty}
                onChange={(e) => updateFilter('specialty', e.target.value)}
                className="w-full rounded-xl border border-slate-600/20 px-3 py-2 text-sm bg-white"
              >
                <option value="">All specialties</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Consultation mode</h3>
              <select
                value={filters.mode}
                onChange={(e) => updateFilter('mode', e.target.value)}
                className="w-full rounded-xl border border-slate-600/20 px-3 py-2 text-sm bg-white"
              >
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Sort by</h3>
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full rounded-xl border border-slate-600/20 px-3 py-2 text-sm bg-white"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          <div>
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <DoctorCardSkeleton key={i} />
                ))}
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-20 text-slate-600">
                <p className="font-heading font-semibold text-lg mb-2">No doctors match these filters</p>
                <p className="text-sm">Try widening your search or clearing filters.</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {doctors.map((doctor) => (
                    <DoctorCard key={doctor._id} doctor={doctor} />
                  ))}
                </div>
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {Array.from({ length: pagination.totalPages }).map((_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={pagination.page === i + 1 ? 'primary' : 'ghost'}
                        onClick={() => goToPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

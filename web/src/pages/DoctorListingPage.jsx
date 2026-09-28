import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SlidersHorizontal, Search, X } from 'lucide-react';
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

const MIN_RATINGS = [
  { value: '', label: 'Any rating' },
  { value: '4.5', label: '4.5 & above' },
  { value: '4', label: '4.0 & above' },
  { value: '3', label: '3.0 & above' },
];

export function DoctorListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [cities, setCities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(searchParams.get('q') || '');
  const [feeDraft, setFeeDraft] = useState({
    minFee: searchParams.get('minFee') || '',
    maxFee: searchParams.get('maxFee') || '',
  });
  const [feeError, setFeeError] = useState('');

  const filters = {
    q: searchParams.get('q') || '',
    specialty: searchParams.get('specialty') || '',
    city: searchParams.get('city') || '',
    mode: searchParams.get('mode') || '',
    minFee: searchParams.get('minFee') || '',
    maxFee: searchParams.get('maxFee') || '',
    minRating: searchParams.get('minRating') || '',
    minExperience: searchParams.get('minExperience') || '',
    sort: searchParams.get('sort') || '',
    page: Number(searchParams.get('page')) || 1,
  };

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([k, v]) => v && k !== 'page' && k !== 'sort').length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams]
  );

  useEffect(() => {
    Promise.all([doctorApi.specialties(), doctorApi.cities()]).then(([specRes, cityRes]) => {
      setSpecialties(specRes.data.specialties);
      setCities(cityRes.data.cities);
    });
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

  const submitSearch = (e) => {
    e.preventDefault();
    updateFilter('q', searchText.trim());
  };

  const submitFeeRange = (e) => {
    e.preventDefault();
    const min = feeDraft.minFee ? Number(feeDraft.minFee) : undefined;
    const max = feeDraft.maxFee ? Number(feeDraft.maxFee) : undefined;
    if (min !== undefined && min < 0) return setFeeError('Minimum fee cannot be negative');
    if (max !== undefined && max < 0) return setFeeError('Maximum fee cannot be negative');
    if (min !== undefined && max !== undefined && max < min) {
      return setFeeError('Maximum fee cannot be lower than the minimum fee');
    }
    setFeeError('');
    const next = new URLSearchParams(searchParams);
    if (feeDraft.minFee) next.set('minFee', feeDraft.minFee);
    else next.delete('minFee');
    if (feeDraft.maxFee) next.set('maxFee', feeDraft.maxFee);
    else next.delete('maxFee');
    next.delete('page');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchText('');
    setFeeDraft({ minFee: '', maxFee: '' });
    setFeeError('');
    setSearchParams({});
  };

  const goToPage = (page) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', page);
    setSearchParams(next);
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading font-bold text-2xl text-charcoal">Find your doctor</h1>
          <button
            className="md:hidden flex items-center gap-1 text-sm font-medium text-teal-600"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        <form onSubmit={submitSearch} className="flex gap-2 mb-6 max-w-xl">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-600/20 bg-white px-3">
            <Search size={16} className="text-slate-600 shrink-0" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by symptom, specialty, or doctor name"
              className="w-full py-2.5 text-sm outline-none bg-transparent"
              maxLength={100}
            />
          </div>
          <Button type="submit" size="md">
            Search
          </Button>
        </form>

        <div className="grid md:grid-cols-[260px_1fr] gap-8">
          <aside className={`space-y-6 ${showFilters ? 'block' : 'hidden md:block'}`}>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-error"
              >
                <X size={14} /> Clear all filters
              </button>
            )}

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
              <h3 className="text-sm font-semibold text-charcoal mb-2">City</h3>
              <select
                value={filters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
                className="w-full rounded-xl border border-slate-600/20 px-3 py-2 text-sm bg-white"
              >
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
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

            <form onSubmit={submitFeeRange}>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Fee range (₹)</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Min"
                  value={feeDraft.minFee}
                  onChange={(e) => setFeeDraft((f) => ({ ...f, minFee: e.target.value }))}
                  className="w-full rounded-xl border border-slate-600/20 px-3 py-2 text-sm bg-white"
                />
                <span className="text-slate-600 text-sm">–</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="Max"
                  value={feeDraft.maxFee}
                  onChange={(e) => setFeeDraft((f) => ({ ...f, maxFee: e.target.value }))}
                  className="w-full rounded-xl border border-slate-600/20 px-3 py-2 text-sm bg-white"
                />
              </div>
              {feeError && <p className="mt-1 text-xs text-error">{feeError}</p>}
              <Button type="submit" size="sm" variant="outline" className="mt-2 w-full">
                Apply fee range
              </Button>
            </form>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Minimum rating</h3>
              <select
                value={filters.minRating}
                onChange={(e) => updateFilter('minRating', e.target.value)}
                className="w-full rounded-xl border border-slate-600/20 px-3 py-2 text-sm bg-white"
              >
                {MIN_RATINGS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Minimum experience</h3>
              <select
                value={filters.minExperience}
                onChange={(e) => updateFilter('minExperience', e.target.value)}
                className="w-full rounded-xl border border-slate-600/20 px-3 py-2 text-sm bg-white"
              >
                <option value="">Any experience</option>
                <option value="3">3+ years</option>
                <option value="5">5+ years</option>
                <option value="10">10+ years</option>
                <option value="15">15+ years</option>
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

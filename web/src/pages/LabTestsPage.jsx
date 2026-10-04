import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BadgeCheck, Clock, FlaskConical, Home, Info, MapPin, Phone, Search } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Skeleton } from '../components/ui/index.js';
import { labApi } from '../api/labApi.js';
import { LAB_TEST_CATEGORIES } from '../constants/labs.js';

const PAGE_SIZE = 10;
const TESTS_PREVIEW = 4;

const formatPrice = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export function LabTestsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get('q') || '');
  const [cities, setCities] = useState([]);
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);

  const q = params.get('q') || '';
  const city = params.get('city') || '';
  const category = params.get('category') || '';
  const homeOnly = params.get('home') === '1';

  useEffect(() => {
    labApi
      .cities()
      .then((res) => setCities(res.data.cities))
      .catch(() => setCities([]));
  }, []);

  useEffect(() => {
    setResult(null);
    labApi
      .list({
        ...(q && { q }),
        ...(city && { city }),
        ...(category && { category }),
        ...(homeOnly && { homeCollection: 'true' }),
        page,
        limit: PAGE_SIZE,
      })
      .then((res) => setResult(res.data))
      .catch(() => setResult({ labs: [], pagination: { total: 0, totalPages: 0 } }));
  }, [q, city, category, homeOnly, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  return (
    <PageTransition>
      <section className="bg-gradient-to-br from-cyan-50 via-sky-50 to-cyan-100/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">{t('labTests.eyebrow')}</p>
          <h1 className="mt-2 font-heading font-extrabold text-3xl sm:text-4xl text-charcoal leading-tight">{t('labTests.title')}</h1>
          <p className="mt-3 text-slate-600 max-w-2xl">{t('labTests.subtitle')}</p>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              updateParam('q', text.trim());
            }}
            className="mt-6 flex flex-col sm:flex-row gap-2"
          >
            <label className="flex flex-1 items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-soft focus-within:ring-2 focus-within:ring-cyan-300">
              <Search size={20} className="text-slate-600 shrink-0" />
              <input
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('labTests.searchPlaceholder')}
                aria-label={t('labTests.searchPlaceholder')}
                className="w-full bg-transparent text-charcoal placeholder:text-slate-600/70 outline-none"
              />
            </label>
            <select
              value={city}
              onChange={(e) => updateParam('city', e.target.value)}
              aria-label={t('labTests.allCities')}
              className="rounded-xl bg-white px-4 py-3 text-sm shadow-soft outline-none"
            >
              <option value="">{t('labTests.allCities')}</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-xl bg-cyan-600 px-6 py-3 font-heading font-semibold text-white hover:bg-cyan-700">
              {t('labTests.search')}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <CategoryChip active={!category} onClick={() => updateParam('category', '')}>
              {t('labTests.allCategories')}
            </CategoryChip>
            {LAB_TEST_CATEGORIES.filter((c) => c.key !== 'other').map((c) => (
              <CategoryChip key={c.key} active={category === c.key} onClick={() => updateParam('category', c.key)}>
                {t(`labTests.categories.${c.key}`)}
              </CategoryChip>
            ))}
            <label className="ml-auto inline-flex items-center gap-2 text-sm text-charcoal cursor-pointer">
              <input type="checkbox" checked={homeOnly} onChange={(e) => updateParam('home', e.target.checked ? '1' : '')} className="h-4 w-4 accent-cyan-600" />
              <Home size={14} className="text-cyan-600" /> {t('labTests.homeOnly')}
            </label>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {!result ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : result.labs.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-soft">
            <FlaskConical className="mx-auto text-cyan-600/60" size={36} />
            <p className="mt-3 font-heading font-semibold text-charcoal">{t('labTests.noResults')}</p>
            <p className="mt-1 text-sm text-slate-600">{t('labTests.noResultsHint')}</p>
            <Link
              to="/doctors?specialty=General%20Physician"
              className="mt-5 inline-flex rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              {t('labTests.askDoctor')}
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-600">{t('labTests.resultsCount', { count: result.pagination.total })}</p>
            <div className="space-y-4">
              {result.labs.map((lab, i) => (
                <LabCard key={lab._id} lab={lab} index={i} />
              ))}
            </div>
            {result.pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3 text-sm">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg px-3 py-1.5 hover:bg-slate-600/10 disabled:opacity-40">
                  ←
                </button>
                <span>
                  {page} / {result.pagination.totalPages}
                </span>
                <button
                  disabled={page >= result.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg px-3 py-1.5 hover:bg-slate-600/10 disabled:opacity-40"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}

        <p className="mt-8 flex items-start gap-2 text-xs text-slate-600">
          <Info size={14} className="shrink-0 mt-0.5" /> {t('labTests.disclaimer')}
        </p>
      </section>
    </PageTransition>
  );
}

function CategoryChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50'
      }`}
    >
      {children}
    </button>
  );
}

function LabCard({ lab, index }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const hasMatches = lab.matchedTests.length > 0;
  const tests = hasMatches ? lab.matchedTests : lab.tests;
  const visible = expanded ? tests : tests.slice(0, TESTS_PREVIEW);
  const hidden = tests.length - visible.length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="rounded-2xl border border-slate-600/10 bg-white p-5 sm:p-6 shadow-soft"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading font-bold text-lg text-charcoal">{lab.name}</h2>
            {lab.accreditations?.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <BadgeCheck size={12} /> {a}
              </span>
            ))}
          </div>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-600">
            <MapPin size={14} className="mt-0.5 shrink-0" /> {lab.address}, {lab.city}
            {lab.pincode ? ` ${lab.pincode}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className={`inline-flex items-center gap-1 font-medium ${lab.homeCollection ? 'text-orange-600' : 'text-slate-600'}`}>
              <Home size={12} />
              {lab.homeCollection
                ? lab.homeCollectionFee > 0
                  ? t('labTests.homeCollectionFee', { fee: lab.homeCollectionFee })
                  : t('labTests.homeCollectionFree')
                : t('labTests.walkInOnly')}
            </span>
            {lab.operatingHours && <span className="text-slate-600">{t('labTests.timings', { text: lab.operatingHours })}</span>}
          </div>
          {lab.description && <p className="mt-2 text-sm text-slate-600 max-w-2xl">{lab.description}</p>}
        </div>
        <a
          href={`tel:${lab.phone}`}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 font-heading font-semibold text-white hover:bg-orange-600"
        >
          <Phone size={16} /> {t('labTests.callToBook')}
        </a>
      </div>

      {tests.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {hasMatches ? t('labTests.matchingTests') : t('labTests.popularTests')}
          </p>
          <ul className="divide-y divide-slate-600/10 rounded-xl border border-slate-600/10">
            {visible.map((test) => (
              <li key={test._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-charcoal">{test.name}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600">
                    <span>{t(`labTests.categories.${test.category}`)}</span>
                    {test.sampleType && <span>{test.sampleType}</span>}
                    {test.reportHours > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {t('labTests.reportIn', { hours: test.reportHours })}
                      </span>
                    )}
                    {test.preparation && <span>{t('labTests.preparation', { text: test.preparation })}</span>}
                  </p>
                </div>
                <p className="shrink-0 text-right">
                  {test.offerPrice != null && test.offerPrice < test.price ? (
                    <>
                      <span className="mr-2 text-xs text-slate-600 line-through">{formatPrice(test.price)}</span>
                      <span className="font-heading font-bold text-charcoal">{formatPrice(test.offerPrice)}</span>
                    </>
                  ) : (
                    <span className="font-heading font-bold text-charcoal">{formatPrice(test.price)}</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
          {(hidden > 0 || expanded) && tests.length > TESTS_PREVIEW && (
            <button onClick={() => setExpanded((v) => !v)} className="mt-2 text-sm font-medium text-cyan-700 hover:underline">
              {expanded ? t('labTests.showLess') : t('labTests.moreTests', { count: hidden })}
            </button>
          )}
        </div>
      )}
    </motion.article>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, ChevronRight, Clock, ArrowRight, BadgeCheck, Stethoscope, Video, FileCheck2 } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Button, Card, DoctorCardSkeleton, Badge, Skeleton } from '../components/ui/index.js';
import { DoctorCard } from '../components/DoctorCard.jsx';
import { ServicesSection } from '../components/home/ServicesSection.jsx';
import { WhyPhoenixCare } from '../components/home/WhyPhoenixCare.jsx';
import { CareMatchModal } from '../components/home/CareMatchModal.jsx';
import { doctorApi } from '../api/doctorApi.js';
import { blogApi } from '../api/blogApi.js';
import { extractErrorMessage } from '../api/client.js';
import { SPECIALTIES } from '../constants/specialties.js';
import toast from 'react-hot-toast';

// The query sent for each chip is the English keyword the backend's symptom search
// understands; only the chip label is translated.
const POPULAR_SEARCHES = [
  { key: 'fever', query: 'fever' },
  { key: 'cough', query: 'cough' },
  { key: 'skinRash', query: 'skin rash' },
  { key: 'pregnancy', query: 'pregnancy' },
];

const HERO_STATS = [
  { key: 'statDoctors', value: '500+' },
  { key: 'statConsultations', value: '50,000+' },
  { key: 'statRating', value: '4.8★' },
];

const fadeUp = (delay) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

export function HomePage() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [availableSpecialties, setAvailableSpecialties] = useState([]);
  const [blogPosts, setBlogPosts] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [careMatchOpen, setCareMatchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // "All services" links elsewhere point to /#services; the router doesn't scroll to hashes.
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, [location.hash]);

  useEffect(() => {
    Promise.all([doctorApi.featured(), doctorApi.specialties()])
      .then(([featuredRes, specialtiesRes]) => {
        setFeatured(featuredRes.data.doctors);
        setAvailableSpecialties(specialtiesRes.data.specialties);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));

    blogApi
      .featured()
      .then((res) => setBlogPosts(res.data.posts))
      .catch(() => setBlogPosts([]));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/doctors?q=${encodeURIComponent(q)}` : '/doctors');
  };

  const specialtyCards = SPECIALTIES.filter((s) => availableSpecialties.includes(s.name));

  return (
    <PageTransition>
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-sky-50 to-cyan-100/70">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div className="max-w-2xl">
            <motion.span
              {...fadeUp(0)}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-xs font-semibold text-cyan-700"
            >
              <BadgeCheck size={14} /> {t('home.heroEyebrow')}
            </motion.span>
            <motion.h1
              {...fadeUp(0.05)}
              className="mt-4 font-heading font-extrabold text-3xl sm:text-5xl leading-tight text-charcoal"
            >
              {t('home.heroTitle')}
            </motion.h1>
            <motion.p {...fadeUp(0.1)} className="mt-3 text-slate-600 text-base sm:text-lg">
              {t('home.heroSubtitle')}
            </motion.p>

            <motion.form {...fadeUp(0.15)} onSubmit={handleSearch} role="search" className="mt-7">
              <label className="flex items-center gap-3 rounded-xl bg-white px-4 py-3.5 shadow-soft focus-within:ring-2 focus-within:ring-cyan-300">
                <Search size={20} className="text-slate-600 shrink-0" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  aria-label={t('home.searchPlaceholder')}
                  className="w-full bg-transparent text-charcoal placeholder:text-slate-600/70 outline-none"
                />
                <button type="submit" className="sr-only">
                  {t('home.searchButton')}
                </button>
              </label>
            </motion.form>

            <motion.div {...fadeUp(0.2)} className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-charcoal mr-1">{t('home.popularSearches')}</span>
              {POPULAR_SEARCHES.map((item) => (
                <button
                  key={item.key}
                  onClick={() => navigate(`/doctors?q=${encodeURIComponent(item.query)}`)}
                  className="rounded-full border border-cyan-200 bg-white px-4 py-1.5 text-sm text-cyan-600 hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
                >
                  {t(`home.popular.${item.key}`)}
                </button>
              ))}
            </motion.div>

            <hr className="my-6 border-cyan-200/70" />

            <motion.div
              {...fadeUp(0.25)}
              className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-cyan-400 bg-white p-5"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
                <Stethoscope size={24} />
              </span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-cyan-600">{t('home.careMatchLabel')}</p>
                <p className="font-heading font-bold text-charcoal text-base sm:text-lg leading-snug">
                  {t('home.careMatchTitle')}
                </p>
                <p className="text-sm text-slate-600">{t('home.careMatchSubtitle')}</p>
              </div>
              <button
                onClick={() => setCareMatchOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-5 py-2.5 font-heading font-semibold text-white hover:bg-cyan-700 transition-colors"
              >
                {t('home.careMatchButton')} <ArrowRight size={16} />
              </button>
            </motion.div>

            <motion.button
              {...fadeUp(0.3)}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/doctors')}
              className="mt-6 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-orange-500 px-7 py-3.5 font-heading text-lg font-semibold text-white shadow-soft hover:bg-orange-600 transition-colors"
            >
              {t('home.bookAppointment')} <ArrowRight size={18} />
            </motion.button>

            <motion.dl {...fadeUp(0.35)} className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {HERO_STATS.map((stat) => (
                <div key={stat.key} className="flex flex-col-reverse">
                  <dt className="text-sm text-charcoal">{t(`home.${stat.key}`)}</dt>
                  <dd className="font-heading text-2xl font-extrabold text-orange-500">{stat.value}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative hidden lg:block"
          >
            <img
              src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80"
              alt="Doctor consulting with a patient over video call"
              className="rounded-3xl shadow-soft-lg object-cover w-full h-[520px]"
            />
            <div className="absolute -left-6 top-10 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft-lg">
              <span className="rounded-full bg-cyan-50 p-2 text-cyan-600">
                <Video size={18} />
              </span>
              <span className="text-sm font-semibold text-charcoal">{t('home.heroBadgeVideo')}</span>
            </div>
            <div className="absolute -right-4 bottom-12 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft-lg">
              <span className="rounded-full bg-orange-50 p-2 text-orange-500">
                <FileCheck2 size={18} />
              </span>
              <span className="text-sm font-semibold text-charcoal">{t('home.heroBadgePrescription')}</span>
            </div>
          </motion.div>
        </div>
      </section>

      <ServicesSection onOpenCareMatch={() => setCareMatchOpen(true)} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="font-heading font-semibold text-2xl text-charcoal">{t('home.browseSpecialty')}</h2>
        <p className="text-sm text-slate-600 mt-1 mb-6">{t('home.browseSpecialtySubtitle')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {specialtyCards.map((s) => (
            <motion.button
              key={s.name}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/doctors?specialty=${encodeURIComponent(s.name)}`)}
              className="flex items-start gap-3 bg-white rounded-2xl shadow-soft p-4 text-left"
            >
              <span className="rounded-full bg-teal-50 p-3 text-teal-600 shrink-0">
                <s.icon size={20} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-charcoal">
                  {t(`specialty.${s.i18nKey}.label`)}
                </span>
                <span className="block text-xs text-slate-600 mt-0.5">{t(`specialty.${s.i18nKey}.tagline`)}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-semibold text-2xl text-charcoal">{t('home.topRated')}</h2>
          <button
            onClick={() => navigate('/doctors')}
            className="flex items-center gap-1 text-teal-600 font-medium text-sm hover:underline"
          >
            {t('home.viewAll')} <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <DoctorCardSkeleton key={i} />)
            : featured.map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} />)}
        </div>
      </section>

      <WhyPhoenixCare />

      {blogPosts === undefined || blogPosts.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-semibold text-2xl text-charcoal">{t('home.fromBlog')}</h2>
            <button
              onClick={() => navigate('/blog')}
              className="flex items-center gap-1 text-teal-600 font-medium text-sm hover:underline"
            >
              {t('home.readMore')} <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {blogPosts === undefined
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)
              : blogPosts.map((post) => (
                  <Link key={post._id} to={`/blog/${post.slug}`}>
                    <Card hoverLift className="h-full flex flex-col">
                      <Badge variant="teal" className="w-fit mb-2 capitalize">
                        {post.category.replace('_', ' ')}
                      </Badge>
                      <p className="font-heading font-semibold text-charcoal mb-1 line-clamp-2">{post.title}</p>
                      <p className="text-sm text-slate-600 line-clamp-2 flex-1">{post.excerpt}</p>
                      <div className="flex items-center justify-between mt-4 text-xs text-slate-600">
                        <span>By {post.author?.user?.name}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {post.readTimeMinutes} min
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
          </div>
        </section>
      ) : null}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <Card className="bg-phoenix-gradient text-white text-center py-10 px-6">
          <h3 className="font-heading font-bold text-2xl mb-2">{t('home.ctaTitle')}</h3>
          <p className="text-white/85 mb-6">{t('home.ctaSubtitle')}</p>
          <Button variant="secondary" className="!bg-white !text-teal-600" onClick={() => navigate('/signup')}>
            {t('home.ctaButton')}
          </Button>
        </Card>
      </section>

      <CareMatchModal isOpen={careMatchOpen} onClose={() => setCareMatchOpen(false)} />
    </PageTransition>
  );
}

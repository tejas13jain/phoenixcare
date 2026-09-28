import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, ChevronRight, Clock, ShieldCheck, Users, Star, Lock } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Button, Card, DoctorCardSkeleton, Badge, Skeleton } from '../components/ui/index.js';
import { DoctorCard } from '../components/DoctorCard.jsx';
import { doctorApi } from '../api/doctorApi.js';
import { blogApi } from '../api/blogApi.js';
import { extractErrorMessage } from '../api/client.js';
import { SPECIALTIES } from '../constants/specialties.js';
import toast from 'react-hot-toast';

const TRUST_STATS = [
  { icon: ShieldCheck, key: 'trustDoctors', value: '500+' },
  { icon: Users, key: 'trustConsultations', value: '50,000+' },
  { icon: Star, key: 'trustRating', value: '4.8★' },
  { icon: Lock, key: 'trustSecure', value: '' },
];

export function HomePage() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [availableSpecialties, setAvailableSpecialties] = useState([]);
  const [blogPosts, setBlogPosts] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

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
    navigate(query ? `/doctors?q=${encodeURIComponent(query)}` : '/doctors');
  };

  const specialtyCards = SPECIALTIES.filter((s) => availableSpecialties.includes(s.name));

  return (
    <PageTransition>
      <section className="bg-phoenix-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-heading font-extrabold text-3xl sm:text-5xl leading-tight"
            >
              {t('home.heroTitle')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-white/90 text-lg"
            >
              {t('home.heroSubtitle')}
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleSearch}
              className="mt-8 flex bg-white rounded-2xl p-2 shadow-soft-lg max-w-md"
            >
              <div className="flex items-center flex-1 px-3">
                <Search size={18} className="text-slate-600 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="w-full px-2 py-2 text-charcoal text-sm outline-none"
                />
              </div>
              <Button type="submit">{t('home.searchButton')}</Button>
            </motion.form>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="hidden md:block"
          >
            <img
              src="https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80"
              alt="Doctor consulting with a patient over video call"
              className="rounded-3xl shadow-soft-lg object-cover w-full h-80"
            />
          </motion.div>
        </div>

        <div className="border-t border-white/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TRUST_STATS.map((stat) => (
              <div key={stat.key} className="flex items-center gap-2.5">
                <stat.icon size={18} className="text-white/85 shrink-0" />
                <div className="leading-tight">
                  {stat.value && <p className="font-heading font-bold text-sm">{stat.value}</p>}
                  <p className="text-white/75 text-xs">{t(`home.${stat.key}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
    </PageTransition>
  );
}

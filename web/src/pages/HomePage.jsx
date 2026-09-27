import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Stethoscope, Baby, HeartPulse, Brain, Smile, Salad, ChevronRight } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Button, Card, DoctorCardSkeleton } from '../components/ui/index.js';
import { DoctorCard } from '../components/DoctorCard.jsx';
import { doctorApi } from '../api/doctorApi.js';
import { extractErrorMessage } from '../api/client.js';
import toast from 'react-hot-toast';

const SPECIALTY_ICONS = {
  'General Physician': Stethoscope,
  Pediatrician: Baby,
  Cardiologist: HeartPulse,
  Psychiatrist: Brain,
  Dentist: Smile,
  Nutritionist: Salad,
};

export function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([doctorApi.featured(), doctorApi.specialties()])
      .then(([featuredRes, specialtiesRes]) => {
        setFeatured(featuredRes.data.doctors);
        setSpecialties(specialtiesRes.data.specialties);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query ? `/doctors?q=${encodeURIComponent(query)}` : '/doctors');
  };

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
              Talk to trusted doctors, anytime, anywhere.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-white/90 text-lg"
            >
              Video, audio, or chat consultations with verified specialists. Rise stronger, every day.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleSearch}
              className="mt-8 flex bg-white rounded-2xl p-2 shadow-soft-lg max-w-md"
            >
              <div className="flex items-center flex-1 px-3">
                <Search size={18} className="text-slate-600" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by symptom, specialty, or doctor"
                  className="w-full px-2 py-2 text-charcoal text-sm outline-none"
                />
              </div>
              <Button type="submit">Search</Button>
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
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="font-heading font-semibold text-2xl text-charcoal mb-6">Browse by specialty</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {specialties.map((s) => {
            const Icon = SPECIALTY_ICONS[s] || Stethoscope;
            return (
              <motion.button
                key={s}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/doctors?specialty=${encodeURIComponent(s)}`)}
                className="flex flex-col items-center gap-2 bg-white rounded-2xl shadow-soft p-4 text-center"
              >
                <span className="rounded-full bg-teal-50 p-3 text-teal-600">
                  <Icon size={22} />
                </span>
                <span className="text-xs font-medium text-charcoal">{s}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-semibold text-2xl text-charcoal">Top-rated doctors</h2>
          <button
            onClick={() => navigate('/doctors')}
            className="flex items-center gap-1 text-teal-600 font-medium text-sm hover:underline"
          >
            View all <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <DoctorCardSkeleton key={i} />)
            : featured.map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} />)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <Card className="bg-phoenix-gradient text-white text-center py-10 px-6">
          <h3 className="font-heading font-bold text-2xl mb-2">New here? Book your first consultation today.</h3>
          <p className="text-white/85 mb-6">Verified doctors. Transparent fees. Digital prescriptions.</p>
          <Button variant="secondary" className="!bg-white !text-teal-600" onClick={() => navigate('/signup')}>
            Get started
          </Button>
        </Card>
      </section>
    </PageTransition>
  );
}

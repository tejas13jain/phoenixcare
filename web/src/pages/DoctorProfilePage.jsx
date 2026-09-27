import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Star, MapPin, Languages, GraduationCap, Video, Phone, MessageCircle, Building2 } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Card, Badge, Button, Skeleton } from '../components/ui/index.js';
import { doctorApi } from '../api/doctorApi.js';
import { extractErrorMessage } from '../api/client.js';

const MODE_META = {
  video: { icon: Video, label: 'Video call' },
  audio: { icon: Phone, label: 'Audio call' },
  chat: { icon: MessageCircle, label: 'Chat' },
  in_clinic: { icon: Building2, label: 'In-clinic' },
};

export function DoctorProfilePage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    doctorApi
      .getById(id)
      .then((res) => {
        setDoctor(res.data.doctor);
        setReviews(res.data.reviews);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (!doctor) return null;

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Card className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="h-24 w-24 rounded-full bg-phoenix-gradient text-white flex items-center justify-center font-heading font-bold text-2xl shrink-0">
            {doctor.user?.name
              ?.split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-2xl text-charcoal">{doctor.user?.name}</h1>
            <p className="text-slate-600">{doctor.specialties?.join(', ')}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Star size={14} className="text-warning fill-warning" /> {doctor.rating?.toFixed(1)} (
                {doctor.ratingCount} reviews)
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap size={14} /> {doctor.experienceYears}+ years experience
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {doctor.city}
              </span>
              <span className="flex items-center gap-1">
                <Languages size={14} /> {doctor.languages?.join(', ')}
              </span>
            </div>
            <p className="mt-3 text-sm text-charcoal">{doctor.bio}</p>
          </div>
        </Card>

        <Card>
          <h2 className="font-heading font-semibold text-lg mb-4">Choose a consultation mode</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {doctor.consultationModes?.map((mode) => {
              const meta = MODE_META[mode];
              const Icon = meta.icon;
              return (
                <motion.button
                  key={mode}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/book/${doctor._id}?mode=${mode}`)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-slate-600/15 p-5 hover:border-teal-500 hover:bg-teal-50/40"
                >
                  <Icon size={22} className="text-teal-600" />
                  <span className="text-sm font-medium">{meta.label}</span>
                  <Badge variant="teal">₹{doctor.fee?.[mode]}</Badge>
                </motion.button>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="font-heading font-semibold text-lg mb-4">Patient reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-600">No reviews yet — be the first to consult and share feedback.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-slate-600/10 pb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-charcoal">{review.patient?.user?.name}</span>
                    <span className="flex items-center gap-0.5 text-xs text-warning">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CheckCircle2, Video, Phone, MessageCircle, Building2, CalendarDays } from 'lucide-react';
import { PageTransition } from '../components/layout/PageTransition.jsx';
import { Card, Button, Badge, Skeleton } from '../components/ui/index.js';
import { doctorApi } from '../api/doctorApi.js';
import { appointmentApi, paymentApi } from '../api/appointmentApi.js';
import { extractErrorMessage } from '../api/client.js';

const STEPS = ['mode', 'slot', 'intake', 'payment', 'confirmation'];
const MODE_META = {
  video: { icon: Video, label: 'Video call' },
  audio: { icon: Phone, label: 'Audio call' },
  chat: { icon: MessageCircle, label: 'Chat' },
  in_clinic: { icon: Building2, label: 'In-clinic' },
};

export function BookingFlowPage() {
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [mode, setMode] = useState(searchParams.get('mode') || '');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [intake, setIntake] = useState({ symptoms: '', durationDays: '' });
  const [appointment, setAppointment] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const stepIndex = mode
    ? selectedSlot
      ? appointment
        ? order
          ? STEPS.indexOf('confirmation')
          : STEPS.indexOf('payment')
        : STEPS.indexOf('intake')
      : STEPS.indexOf('slot')
    : STEPS.indexOf('mode');

  useEffect(() => {
    doctorApi
      .getById(doctorId)
      .then((res) => setDoctor(res.data.doctor))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [doctorId]);

  useEffect(() => {
    if (!mode) return;
    doctorApi.getSlots(doctorId, { mode }).then((res) => setSlots(res.data.slots));
  }, [doctorId, mode]);

  const slotsByDate = useMemo(() => {
    const grouped = {};
    for (const slot of slots) {
      grouped[slot.date] = grouped[slot.date] || [];
      grouped[slot.date].push(slot);
    }
    return grouped;
  }, [slots]);

  const handleCreateAppointment = async () => {
    setSubmitting(true);
    try {
      const { data } = await appointmentApi.create({
        doctorId,
        slotId: selectedSlot._id,
        mode,
        intakeForm: {
          symptoms: intake.symptoms,
          durationDays: intake.durationDays ? Number(intake.durationDays) : undefined,
        },
      });
      setAppointment(data.appointment);
      if (data.appointment.status === 'confirmed') {
        setOrder({ free: true });
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    setSubmitting(true);
    try {
      const { data } = await paymentApi.createOrder(appointment._id);
      if (data.keyId) {
        toast('Razorpay live keys detected — integrate window.Razorpay checkout here.', { icon: '💳' });
      }
      // Demo/stub mode (no live Razorpay keys): complete the payment immediately using
      // the backend's stub-friendly signature verification. Swap this block for the real
      // Razorpay Checkout `handler` callback once RAZORPAY_KEY_ID/SECRET are set.
      await paymentApi.verify({
        appointmentId: appointment._id,
        razorpayOrderId: data.orderId,
        razorpayPaymentId: `pay_stub_${Date.now()}`,
        razorpaySignature: 'stub-signature',
      });
      setOrder(data);
      toast.success('Payment successful!');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((step, i) => (
            <div key={step} className="flex-1 flex items-center">
              <div
                className={`h-2 flex-1 rounded-full ${i <= stepIndex ? 'bg-phoenix-gradient' : 'bg-slate-600/15'}`}
              />
            </div>
          ))}
        </div>

        <h1 className="font-heading font-bold text-xl text-charcoal mb-1">
          Book with {doctor?.user?.name}
        </h1>
        <p className="text-sm text-slate-600 mb-6">{doctor?.specialties?.join(', ')}</p>

        <AnimatePresence mode="wait">
          {stepIndex === 0 && (
            <StepCard key="mode">
              <h2 className="font-heading font-semibold mb-4">Choose a consultation mode</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {doctor?.consultationModes?.map((m) => {
                  const meta = MODE_META[m];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className="flex items-center gap-3 rounded-2xl border border-slate-600/15 p-4 hover:border-teal-500 hover:bg-teal-50/40 text-left"
                    >
                      <Icon size={20} className="text-teal-600" />
                      <div>
                        <p className="font-medium text-sm">{meta.label}</p>
                        <p className="text-xs text-slate-600">₹{doctor.fee?.[m]}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </StepCard>
          )}

          {stepIndex === 1 && (
            <StepCard key="slot">
              <h2 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <CalendarDays size={18} /> Pick a slot
              </h2>
              {Object.keys(slotsByDate).length === 0 ? (
                <p className="text-sm text-slate-600">No available slots for this mode right now.</p>
              ) : (
                <div className="space-y-5">
                  {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                    <div key={date}>
                      <p className="text-sm font-medium text-charcoal mb-2">
                        {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {dateSlots.map((slot) => (
                          <button
                            key={slot._id}
                            onClick={() => setSelectedSlot(slot)}
                            className="rounded-xl border border-slate-600/20 px-3 py-1.5 text-xs font-medium hover:border-teal-500 hover:bg-teal-50"
                          >
                            {slot.startTime}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </StepCard>
          )}

          {stepIndex === 2 && (
            <StepCard key="intake">
              <h2 className="font-heading font-semibold mb-4">Tell us what's going on</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-charcoal">Symptoms</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-600/20 px-4 py-2.5 text-sm"
                    rows={4}
                    value={intake.symptoms}
                    onChange={(e) => setIntake((f) => ({ ...f, symptoms: e.target.value }))}
                    placeholder="Describe your symptoms in a few sentences"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-charcoal">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-xl border border-slate-600/20 px-4 py-2.5 text-sm"
                    value={intake.durationDays}
                    onChange={(e) => setIntake((f) => ({ ...f, durationDays: e.target.value }))}
                  />
                </div>
                <Button className="w-full" loading={submitting} onClick={handleCreateAppointment}>
                  Continue to payment
                </Button>
              </div>
            </StepCard>
          )}

          {stepIndex === 3 && (
            <StepCard key="payment">
              <h2 className="font-heading font-semibold mb-4">Confirm & pay</h2>
              <div className="rounded-2xl bg-slate-600/5 p-4 mb-4 text-sm space-y-1">
                <p>
                  <strong>{doctor.user?.name}</strong> — {MODE_META[mode].label}
                </p>
                <p>
                  {selectedSlot?.date} at {selectedSlot?.startTime}
                </p>
                <p className="font-heading font-semibold text-lg text-teal-700">₹{appointment?.fee}</p>
              </div>
              <Button className="w-full" loading={submitting} onClick={handlePay}>
                Pay ₹{appointment?.fee} & confirm
              </Button>
            </StepCard>
          )}

          {stepIndex === 4 && (
            <StepCard key="confirmation">
              <div className="flex flex-col items-center text-center py-6">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                >
                  <CheckCircle2 size={64} className="text-success" strokeWidth={1.5} />
                </motion.div>
                <h2 className="font-heading font-bold text-xl mt-4">Appointment confirmed!</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Your {MODE_META[mode].label.toLowerCase()} with {doctor.user?.name} is booked for{' '}
                  {selectedSlot?.date} at {selectedSlot?.startTime}.
                </p>
                <Badge variant="success" className="mt-3">
                  Fee paid: ₹{appointment?.fee}
                </Badge>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => navigate('/patient/appointments')}>
                    View my appointments
                  </Button>
                  <Button onClick={() => navigate('/patient/dashboard')}>Go to dashboard</Button>
                </div>
              </div>
            </StepCard>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

function StepCard({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
    >
      <Card>{children}</Card>
    </motion.div>
  );
}

import { Appointment } from '../models/Appointment.js';
import { Payment } from '../models/Payment.js';
import { Patient } from '../models/Patient.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { createRazorpayOrder, verifyPaymentSignature, verifyWebhookSignature } from '../services/paymentService.js';
import { notifyUser } from '../services/notificationService.js';

export const createOrder = catchAsync(async (req, res) => {
  const { appointmentId } = req.validated.body;

  const appointment = await Appointment.findById(appointmentId).populate('doctor');
  if (!appointment) throw ApiError.notFound('Appointment not found');
  if (appointment.status !== 'pending_payment') {
    throw ApiError.conflict('This appointment is not awaiting payment');
  }

  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient || patient._id.toString() !== appointment.patient.toString()) {
    throw ApiError.forbidden('This appointment does not belong to you');
  }

  const order = await createRazorpayOrder({
    amount: appointment.fee,
    receipt: `appt_${appointment._id}`,
    notes: { appointmentId: appointment._id.toString() },
  });

  const payment = await Payment.create({
    appointment: appointment._id,
    patient: patient._id,
    amount: appointment.fee,
    razorpayOrderId: order.id,
    status: 'created',
  });

  appointment.payment = payment._id;
  await appointment.save();

  res.status(201).json({
    success: true,
    data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID || null },
  });
});

export const verifyPayment = catchAsync(async (req, res) => {
  const { appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.validated.body;

  const valid = verifyPaymentSignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature });
  if (!valid) throw ApiError.badRequest('Payment signature verification failed');

  const payment = await Payment.findOne({ appointment: appointmentId, razorpayOrderId });
  if (!payment) throw ApiError.notFound('Payment record not found');

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.status = 'paid';
  await payment.save();

  const appointment = await Appointment.findById(appointmentId).populate('doctor');
  appointment.status = 'confirmed';
  await appointment.save();

  await notifyUser(appointment.doctor.user, {
    title: 'Appointment confirmed',
    body: `Payment received for the ${appointment.mode} consultation on ${appointment.date}`,
    type: 'payment',
  });

  res.json({ success: true, message: 'Payment verified, appointment confirmed', data: { appointment, payment } });
});

// Razorpay server-to-server webhook (payment.captured / payment.failed / refund events).
// Mounted with express.raw() at the app level so req.body arrives as a Buffer we can verify.
export const handleWebhook = catchAsync(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const valid = verifyWebhookSignature(req.body, signature);
  if (!valid) throw ApiError.unauthorized('Invalid webhook signature');

  const payload = JSON.parse(req.body.toString('utf8'));
  const event = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;

  if (event === 'payment.failed' && paymentEntity) {
    await Payment.findOneAndUpdate({ razorpayOrderId: paymentEntity.order_id }, { status: 'failed' });
  } else if (event === 'payment.captured' && paymentEntity) {
    await Payment.findOneAndUpdate({ razorpayOrderId: paymentEntity.order_id }, { status: 'paid' });
  }

  res.json({ received: true });
});

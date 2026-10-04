import { Slot } from '../models/Slot.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export const listSlots = catchAsync(async (req, res) => {
  const { date, from, to, mode } = req.validated.query;
  const filter = { doctor: req.targetDoctor._id };

  const isOwner =
    req.user?.role === 'admin' ||
    (req.user?.role === 'doctor' && req.targetDoctor.user.toString() === req.user._id.toString());
  if (!isOwner) {
    // Patients only ever see open slots, and none at all for a doctor who isn't verified yet.
    if (req.targetDoctor.kycStatus !== 'verified') return res.json({ success: true, data: { slots: [] } });
    filter.status = 'available';
  }

  if (date) filter.date = date;
  else if (from && to) filter.date = { $gte: from, $lte: to };

  if (mode) filter.modes = mode;

  const slots = await Slot.find(filter).sort({ date: 1, startTime: 1 }).lean();
  res.json({ success: true, data: { slots } });
});

export const generateSlots = catchAsync(async (req, res) => {
  const { dates, startTime, endTime, slotDurationMinutes, modes } = req.validated.body;

  const docs = [];
  for (const date of dates) {
    let cursor = startTime;
    while (cursor < endTime) {
      const next = addMinutes(cursor, slotDurationMinutes);
      if (next > endTime) break;
      docs.push({
        doctor: req.targetDoctor._id,
        date,
        startTime: cursor,
        endTime: next,
        modes,
        status: 'available',
      });
      cursor = next;
    }
  }

  // Skip slots that already exist for this doctor/date/time (unique index) instead of failing the whole batch.
  const result = await Slot.insertMany(docs, { ordered: false }).catch((err) => {
    if (err.code === 11000 || err.writeErrors) return err.insertedDocs || [];
    throw err;
  });

  res.status(201).json({ success: true, message: 'Slots generated', data: { count: Array.isArray(result) ? result.length : docs.length } });
});

export const updateSlotStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!['available', 'blocked'].includes(status)) {
    throw ApiError.badRequest('Status must be "available" or "blocked"');
  }

  const slot = await Slot.findOne({ _id: req.params.slotId, doctor: req.targetDoctor._id });
  if (!slot) throw ApiError.notFound('Slot not found');
  if (slot.status === 'booked') throw ApiError.conflict('Cannot modify a slot that is already booked');

  slot.status = status;
  await slot.save();
  res.json({ success: true, message: 'Slot updated', data: { slot } });
});

export const deleteSlot = catchAsync(async (req, res) => {
  const slot = await Slot.findOne({ _id: req.params.slotId, doctor: req.targetDoctor._id });
  if (!slot) throw ApiError.notFound('Slot not found');
  if (slot.status === 'booked') throw ApiError.conflict('Cannot delete a slot that is already booked');

  await slot.deleteOne();
  res.json({ success: true, message: 'Slot deleted' });
});

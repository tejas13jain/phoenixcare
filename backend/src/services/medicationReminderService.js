import { Medication } from '../models/Medication.js';
import { notifyUser } from './notificationService.js';
import { logger } from '../config/logger.js';

const CHECK_INTERVAL_MS = 60 * 1000; // sweep every minute

function currentSlot() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return { date, time: `${hh}:${mm}`, slotKey: `${date} ${hh}:${mm}` };
}

async function sweep() {
  const { date, time, slotKey } = currentSlot();

  const due = await Medication.find({
    isActive: true,
    times: time,
    startDate: { $lte: date },
    $or: [{ endDate: null }, { endDate: { $gte: date } }],
    lastNotifiedSlots: { $ne: slotKey },
  }).populate({ path: 'patient', populate: { path: 'user', select: 'name email' } });

  for (const med of due) {
    try {
      await notifyUser(med.patient.user._id, {
        title: 'Medication reminder',
        body: `Time to take ${med.name} (${med.dosage}).`,
        type: 'system',
        channels: ['in_app', 'email', 'push'],
        email: med.patient.user.email,
        recipientName: med.patient.user.name,
      });
      // Keep the marker list small — only the last day's worth of slots matters.
      med.lastNotifiedSlots = [...med.lastNotifiedSlots.filter((s) => s.startsWith(date)), slotKey];
      await med.save();
    } catch (err) {
      logger.error(`Medication reminder failed for ${med._id}: ${err.message}`);
    }
  }
}

let timer = null;

export function startMedicationReminders() {
  if (timer) return;
  timer = setInterval(() => {
    sweep().catch((err) => logger.error(`Medication reminder sweep failed: ${err.message}`));
  }, CHECK_INTERVAL_MS);
  logger.info('Medication reminder scheduler started (checks every minute)');
}

export function stopMedicationReminders() {
  if (timer) clearInterval(timer);
  timer = null;
}

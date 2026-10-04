import { Doctor } from '../models/Doctor.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { sendEmail } from './emailService.js';
import { TERMS_INTRO, TERMS_SECTIONS, TERMS_VERSION } from '../constants/doctorTerms.js';

const termsUrl = () => `${env.clientUrl}/doctor/terms`;

const esc = (text) =>
  String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const firstName = (name) => esc(name.replace(/^dr\.?\s*/i, '').split(' ')[0]);

// The full list of conditions, laid out for an email: one block per section, with the laws it
// comes from in small print and the rules as plain bullet points.
function renderSections() {
  return TERMS_SECTIONS.map((section) => {
    const items = section.points.map((p) => `<li style="margin:0 0 6px;">${esc(p)}</li>`).join('');
    const law = section.law
      ? `<div style="font-size:11px;color:#8a97a0;margin:0 0 6px;">${esc(section.law)}</div>`
      : '';
    return `<h3 style="font-family:Arial,Helvetica,sans-serif;color:#1E2A32;font-size:15px;margin:22px 0 2px;">${esc(section.title)}</h3>
      ${law}<ul style="margin:6px 0 0;padding-left:18px;">${items}</ul>`;
  }).join('');
}

// Sent once per doctor after onboarding (or after KYC verification for self sign-ups): every
// standard that applies to practising on an Indian online portal, in plain language.
export async function sendStandardsEmail(doctor, user) {
  const body = `<p style="margin:0 0 12px;">Dear Dr. ${firstName(user.name)},</p>
    <p style="margin:0 0 12px;">Welcome to PhoenixCare. Before you start consulting patients, please read the conditions below.
    They are the standards every doctor follows on an online healthcare portal in India — taken from PhoenixCare’s rules and the
    main Indian laws and guidelines.</p>
    <div style="background:#FFF4EC;border-left:4px solid #FF6B35;padding:12px 14px;margin:0 0 8px;border-radius:6px;">
      <strong>What you need to do:</strong> the first time you sign in, you will be asked to read and accept these
      Doctor Terms &amp; Conditions. You cannot open slots, take consultations or write prescriptions until you accept.
    </div>
    <p style="margin:12px 0 0;color:#445866;">${esc(TERMS_INTRO)}</p>
    ${renderSections()}
    <p style="margin:24px 0 0;">If anything is unclear, reply to this email or write to support@phoenixcare.demo before you accept.
    Terms version: ${esc(TERMS_VERSION)}.</p>`;

  const result = await sendEmail({
    to: user.email,
    subject: 'PhoenixCare doctor account — the standards you agree to follow',
    title: 'Standards for practising on PhoenixCare',
    preheader: 'Please read these conditions — you will be asked to accept them when you first sign in.',
    body,
    ctaLabel: 'Read and accept the terms',
    ctaUrl: termsUrl(),
  });
  // `sent: false` means no SMTP is configured (the email was only logged) — leave it unmarked
  // so it can be re-sent once email is set up.
  if (result.sent) await Doctor.updateOne({ _id: doctor._id }, { standardsEmailSentAt: new Date() });
  return result;
}

// Same email, but never twice — for automatic triggers (onboarding, KYC verified).
export async function sendStandardsEmailOnce(doctor, user) {
  const current = await Doctor.findById(doctor._id).select('standardsEmailSentAt').lean();
  if (current?.standardsEmailSentAt) return { sent: false, alreadySent: true };
  try {
    return await sendStandardsEmail(doctor, user);
  } catch (err) {
    logger.error(`Standards email to ${user.email} failed: ${err.message}`);
    return { sent: false, error: true };
  }
}

// Receipt for the doctor's records once they accept.
export async function sendAcceptanceReceipt(user, { version, acceptedAt }) {
  try {
    await sendEmail({
      to: user.email,
      subject: 'You accepted the PhoenixCare Doctor Terms & Conditions',
      title: 'Terms accepted — thank you',
      body: `<p style="margin:0 0 12px;">Dear Dr. ${firstName(user.name)},</p>
        <p style="margin:0 0 12px;">This confirms that you accepted the PhoenixCare Doctor Terms &amp; Conditions
        (version ${esc(version)}) on ${esc(acceptedAt.toUTCString())}. You can now set your availability and start taking consultations.</p>
        <p style="margin:0;">You can read the conditions again any time from your doctor dashboard.
        If they change in a meaningful way, we will ask you to accept the new version.</p>`,
      ctaLabel: 'Go to my dashboard',
      ctaUrl: `${env.clientUrl}/doctor/dashboard`,
    });
  } catch (err) {
    logger.error(`Acceptance receipt to ${user.email} failed: ${err.message}`);
  }
}

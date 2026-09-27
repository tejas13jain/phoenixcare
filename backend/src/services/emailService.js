import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter = null;
function getTransporter() {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

function wrapTemplate({ title, body, ctaLabel, ctaUrl }) {
  return `
  <div style="background:#F7FAFA;padding:32px 16px;font-family:'Inter',Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(30,42,50,0.08);">
      <div style="background:linear-gradient(135deg,#0F6E6A 0%,#2C8FEA 45%,#FF6B35 100%);padding:28px 32px;">
        <span style="font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:22px;color:#ffffff;">PhoenixCare</span>
        <div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:2px;">Rise stronger, every day.</div>
      </div>
      <div style="padding:32px;">
        <h2 style="font-family:'Poppins',Arial,sans-serif;color:#1E2A32;font-size:19px;margin:0 0 12px;">${title}</h2>
        <div style="color:#445866;font-size:14px;line-height:1.6;">${body}</div>
        ${
          ctaUrl
            ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:linear-gradient(135deg,#0F6E6A,#2C8FEA);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">${ctaLabel || 'Open PhoenixCare'}</a>`
            : ''
        }
      </div>
      <div style="padding:16px 32px;border-top:1px solid #4458661A;color:#9aa7ad;font-size:11px;">
        You're receiving this because you have a PhoenixCare account. This is a transactional email about your care.
      </div>
    </div>
  </div>`;
}

export async function sendEmail({ to, subject, title, body, ctaLabel, ctaUrl }) {
  const html = wrapTemplate({ title: title || subject, body, ctaLabel, ctaUrl });
  const client = getTransporter();

  if (!client) {
    logger.info(`[Email stub — set SMTP_* in .env to send for real] To ${to}: "${subject}" — ${body.replace(/<[^>]+>/g, ' ')}`);
    return { sent: false, stub: true };
  }

  await client.sendMail({ from: env.smtp.from, to, subject, html });
  return { sent: true };
}

export async function sendOtpEmail(to, code, minutes) {
  return sendEmail({
    to,
    subject: `${code} is your PhoenixCare verification code`,
    title: 'Verify it\'s you',
    body: `Your one-time code is <strong style="font-size:22px;letter-spacing:3px;color:#0F6E6A;">${code}</strong>.
      It expires in ${minutes} minutes. If you didn't request this, you can safely ignore this email.`,
  });
}

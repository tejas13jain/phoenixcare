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

function wrapTemplate({ title, body, ctaLabel, ctaUrl, preheader }) {
  const year = new Date().getFullYear();
  // Full document + table-based layout for compatibility with Outlook/older clients, which
  // don't render CSS gradients or bare <div> emails reliably. bgcolor attributes are a
  // fallback for the linear-gradient() header so it still reads as branded even there.
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F7FAFA;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none;font-size:1px;color:#F7FAFA;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${preheader || title}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7FAFA;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(30,42,50,0.08);">
            <tr>
              <td bgcolor="#0F6E6A" style="background:linear-gradient(135deg,#0F6E6A 0%,#2C8FEA 45%,#FF6B35 100%);padding:28px 32px;">
                <span style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:22px;color:#ffffff;">PhoenixCare</span>
                <div style="color:rgba(255,255,255,0.9);font-size:13px;margin-top:2px;">Rise stronger, every day.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="font-family:Arial,Helvetica,sans-serif;color:#1E2A32;font-size:19px;margin:0 0 12px;">${title}</h2>
                <div style="color:#445866;font-size:14px;line-height:1.6;">${body}</div>
                ${
                  ctaUrl
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr><td bgcolor="#0F6E6A" style="background:linear-gradient(135deg,#0F6E6A,#2C8FEA);border-radius:12px;"><a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${ctaLabel || 'Open PhoenixCare'}</a></td></tr></table>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px;border-top:1px solid #E2E8E8;color:#8a97a0;font-size:11px;line-height:1.6;">
                You're receiving this because you have a PhoenixCare account. This is a transactional email about your care.<br/>
                PhoenixCare &middot; support@phoenixcare.demo &middot; &copy; ${year} PhoenixCare
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendEmail({ to, subject, title, body, ctaLabel, ctaUrl, preheader }) {
  const html = wrapTemplate({ title: title || subject, body, ctaLabel, ctaUrl, preheader });
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

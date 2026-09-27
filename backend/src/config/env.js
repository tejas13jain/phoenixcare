import dotenv from 'dotenv';

dotenv.config();

const required = (key, fallback = undefined) => {
  const value = process.env[key] ?? fallback;
  return value;
};

export const env = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: Number(required('PORT', 5000)),
  clientUrl: required('CLIENT_URL', 'http://localhost:5173'),
  adminUrl: required('ADMIN_URL', 'http://localhost:5173/admin'),

  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/phoenixcare'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
    accessExpires: required('JWT_ACCESS_EXPIRES', '15m'),
    refreshExpires: required('JWT_REFRESH_EXPIRES', '30d'),
  },

  otpExpiresMinutes: Number(required('OTP_EXPIRES_MINUTES', 5)),

  cloudinary: {
    cloudName: required('CLOUDINARY_CLOUD_NAME'),
    apiKey: required('CLOUDINARY_API_KEY'),
    apiSecret: required('CLOUDINARY_API_SECRET'),
  },

  razorpay: {
    keyId: required('RAZORPAY_KEY_ID'),
    keySecret: required('RAZORPAY_KEY_SECRET'),
    webhookSecret: required('RAZORPAY_WEBHOOK_SECRET'),
  },

  twilio: {
    accountSid: required('TWILIO_ACCOUNT_SID'),
    authToken: required('TWILIO_AUTH_TOKEN'),
    fromNumber: required('TWILIO_FROM_NUMBER'),
    whatsappFrom: required('TWILIO_WHATSAPP_FROM'),
  },

  fcm: {
    projectId: required('FCM_PROJECT_ID'),
    clientEmail: required('FCM_CLIENT_EMAIL'),
    privateKey: required('FCM_PRIVATE_KEY', '').replace(/\\n/g, '\n'),
  },

  smtp: {
    host: required('SMTP_HOST'),
    port: Number(required('SMTP_PORT', 587)),
    user: required('SMTP_USER'),
    pass: required('SMTP_PASS'),
    from: required('EMAIL_FROM', 'PhoenixCare <no-reply@phoenixcare.demo>'),
  },

  webPush: {
    publicKey: required('VAPID_PUBLIC_KEY'),
    privateKey: required('VAPID_PRIVATE_KEY'),
    contactEmail: required('VAPID_CONTACT_EMAIL', 'mailto:support@phoenixcare.demo'),
  },

  agora: {
    appId: required('AGORA_APP_ID'),
    appCertificate: required('AGORA_APP_CERTIFICATE'),
  },

  isProd: required('NODE_ENV', 'development') === 'production',
};

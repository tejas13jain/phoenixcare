import { phoneVariants } from '../utils/phone.js';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { issueOtp, verifyOtp } from '../services/otpService.js';

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function issueTokenPair(user, deviceInfo) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokens.push({
    token: refreshToken,
    deviceInfo,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  // Keep only the 5 most recent sessions per account.
  if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);
  await user.save();

  return { accessToken, refreshToken };
}

export const signup = catchAsync(async (req, res) => {
  const { name, email, phone, password, role } = req.validated.body;

  const existing = await User.findOne({ $or: [{ email }, { phone: { $in: phoneVariants(phone) } }] });
  if (existing) throw ApiError.conflict('An account with this email or phone already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, phone, passwordHash, role });

  if (role === 'doctor') {
    await Doctor.create({ user: user._id, registrationNumber: `PENDING-${user._id.toString().slice(-8)}`, specialties: [] });
  } else {
    await Patient.create({ user: user._id });
  }

  const tokens = await issueTokenPair(user, req.headers['user-agent']);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user: user.toSafeJSON(), ...tokens },
  });
});

export const login = catchAsync(async (req, res) => {
  const { identifier, password } = req.validated.body;

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: { $in: phoneVariants(identifier) } }],
  }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid credentials');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  user.lastLoginAt = new Date();
  const tokens = await issueTokenPair(user, req.headers['user-agent']);

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: { user: user.toSafeJSON(), ...tokens },
  });
});

export const requestOtp = catchAsync(async (req, res) => {
  const { identifier, channel, purpose } = req.validated.body;
  await issueOtp({ identifier, channel, purpose });
  res.json({ success: true, message: `OTP sent via ${channel}` });
});

export const verifyOtpAndLogin = catchAsync(async (req, res) => {
  const { identifier, code, purpose } = req.validated.body;
  const result = await verifyOtp({ identifier, code, purpose });
  if (!result.valid) throw ApiError.badRequest(result.reason);

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: { $in: phoneVariants(identifier) } }],
  });
  if (!user) throw ApiError.notFound('No account found for this identifier');

  if (identifier.includes('@')) user.isEmailVerified = true;
  else user.isPhoneVerified = true;
  user.lastLoginAt = new Date();

  const tokens = await issueTokenPair(user, req.headers['user-agent']);

  res.json({
    success: true,
    message: 'Verified successfully',
    data: { user: user.toSafeJSON(), ...tokens },
  });
});

export const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.validated.body;

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Refresh token is invalid or expired');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens.token');
  const stored = user?.refreshTokens.find((rt) => rt.token === refreshToken);
  if (!user || !stored) throw ApiError.unauthorized('Refresh token not recognized — please log in again');

  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== refreshToken);
  const tokens = await issueTokenPair(user, req.headers['user-agent']);

  res.json({ success: true, data: tokens });
});

export const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await User.updateOne({ _id: req.user._id }, { $pull: { refreshTokens: { token: refreshToken } } });
  }
  res.json({ success: true, message: 'Logged out' });
});

export const me = catchAsync(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

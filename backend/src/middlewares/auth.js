import { User } from '../models/User.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

export const requireAuth = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or invalid authorization header');
  }
  const token = header.slice(7);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Access token is invalid or expired');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account not found or deactivated');
  }

  req.user = user;
  next();
});

// Best-effort auth: attaches req.user when a valid Bearer token is present, but never rejects
// the request otherwise. Used on routes that are public but behave differently for the owner
// (e.g. a doctor seeing their own booked/blocked slots vs. patients seeing only available ones).
export const attachUserIfPresent = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();

  try {
    const payload = verifyAccessToken(header.slice(7));
    const user = await User.findById(payload.sub);
    if (user && user.isActive) req.user = user;
  } catch {
    // Invalid/expired token on a public route — proceed unauthenticated rather than failing.
  }
  next();
});

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

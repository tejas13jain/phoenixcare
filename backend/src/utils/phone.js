// Phone numbers are typed many ways: "98123 45678", "098123-45678", "+91 98123 45678",
// "0091 98123 45678". normalizePhone turns any of them into one stored form (+<country><number>)
// so the same person can't register twice and can log in however they type it.
//
// A bare 10-digit number starting 6–9 (or with a leading 0) is treated as an Indian mobile
// number, since that's who PhoenixCare serves; anything with a "+" or "00" is taken as given.
export function normalizePhone(input) {
  const raw = String(input ?? '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;

  if (raw.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 11 && digits[0] === '0' && /^[6-9]/.test(digits[1])) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

// Every form a stored number might be in. Accounts created before normalisation may hold the
// number exactly as typed (e.g. "9812345678"), so lookups try the old and the new spelling.
export function phoneVariants(input) {
  const raw = String(input ?? '').trim();
  const normalized = normalizePhone(raw);
  const variants = new Set([raw, normalized, normalized.replace(/^\+/, '')]);
  if (/^\+91\d{10}$/.test(normalized)) variants.add(normalized.slice(3));
  return [...variants].filter(Boolean);
}

export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

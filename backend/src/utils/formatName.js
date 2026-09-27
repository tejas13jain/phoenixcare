// Strips a leading "Dr." (or similar) honorific so greetings read naturally for doctor accounts.
// Mirrors web/src/utils/formatName.js — keep both in sync if the logic changes.
export function getFirstName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const withoutHonorific = parts[0]?.replace(/\.$/, '').toLowerCase() === 'dr' ? parts.slice(1) : parts;
  return withoutHonorific[0] || fullName;
}

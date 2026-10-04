// Escapes user input before it's placed in a MongoDB $regex, so a search like "c++" or
// "(knee)" matches literally instead of throwing or matching unintended text.
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * "+1 (585) 333-4208", "877.432.6637", "00387 61 234 567" -> E.164 ("+15853334208", "+18774326637", "+38761234567").
 * 10-digit numbers without a country code are read as US/Canada (that's how US brands list them).
 * Returns null when we can't be sure, so the UI can ask for the country code instead of texting a wrong number.
 */
export function toE164(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("+")) {
    const d = digits.slice(1).replace(/\D/g, "");
    return d.length >= 8 && d.length <= 15 ? `+${d}` : null;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("251")) return digits;
  if (digits.startsWith("0")) return `251${digits.slice(1)}`;
  return digits;
}

export function extractPhoneNumbers(text: string) {
  const matches = text.match(/(?:\+?251|0)?[\s-]*9[\d\s-]{7,10}/g) ?? [];
  return [...new Set(matches.map((match) => normalizePhone(match)))];
}

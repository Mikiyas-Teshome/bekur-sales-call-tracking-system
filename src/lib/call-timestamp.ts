export function resolveCallTimestamp(input?: string | null) {
  if (!input) return new Date();

  const trimmed = input.trim();
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return new Date();

  return parsed;
}

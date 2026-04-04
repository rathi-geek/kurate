export function validateUsername(value: string): string | null {
  if (value.length < 2) return "Must be at least 2 characters";
  if (value.length > 20) return "Must be 20 characters or less";
  if (!/^[a-z0-9._-]+$/.test(value)) return "Only letters, numbers, _ - . allowed";
  if (!/^[a-z0-9]/.test(value)) return "Must start with a letter or number";
  if (!/[a-z0-9]$/.test(value)) return "Must end with a letter or number";
  if (/[._-]{2,}/.test(value)) return "Cannot have consecutive . _ or -";
  return null;
}

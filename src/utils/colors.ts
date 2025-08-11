export function isValidHexColor(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^#([0-9A-Fa-f]{6})$/.test(value.trim());
}

export function normalizeColorForPicker(value: string | undefined | null, fallback: string = '#000000'): string {
  return isValidHexColor(value || '') ? (value as string) : fallback;
}



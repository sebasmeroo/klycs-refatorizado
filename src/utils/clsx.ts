type ClassValue = string | number | boolean | undefined | null;

export function clsx(...classes: ClassValue[]): string {
  return classes
    .filter(Boolean)
    .join(' ')
    .trim();
}
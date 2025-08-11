import { clsx } from './clsx';

type ClassValue = string | number | boolean | undefined | null;

export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}
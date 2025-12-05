import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a string ID to a number for Supabase queries
 * Route params from Next.js come as strings, but Supabase IDs are numbers
 */
export function parseId(id: string): number {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid ID: ${id}`);
  }
  return parsed;
}

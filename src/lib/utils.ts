import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple Tailwind CSS class values into a single string.
 *
 * `clsx` handles conditional class expressions while `tailwind-merge`
 * resolves conflicts, keeping the last occurrence of a utility. This
 * simplifies dynamic class composition and ensures predictable styles.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

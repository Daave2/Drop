import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Concisely merge Tailwind CSS class names.
 * Combines `clsx` for conditional classes with `tailwind-merge` to resolve
 * conflicts, producing a single string ready for the `className` prop.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Normalize list data from API / React Query (array, axios body, or `{ data: T[] }`). */
export function asArray<T>(value: unknown): T[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "object" && "data" in (value as object)) {
    const inner = (value as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

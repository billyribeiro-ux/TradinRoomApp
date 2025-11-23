// Fixed: 2025-01-24 - Eradicated 1 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

// src/utils/cn.ts
export function cn(...classes: (string | boolean | undefined  )[]) {
  return classes.filter(Boolean).join(" ");
}

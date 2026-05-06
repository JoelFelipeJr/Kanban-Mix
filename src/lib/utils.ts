import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const typeColorConfig: Record<string, string> = {
  INI: "text-purple-400",
  EPI: "text-orange-400",
  STY: "text-blue-400",
  TSK: "text-emerald-400",
  BUG: "text-red-400",
  REV: "text-cyan-400",
  IMP: "text-yellow-400",
};

export const getTypeColor = (type: string | undefined | null) => {
  if (!type) return "text-indigo-400";
  return typeColorConfig[type] || "text-indigo-400";
};

export const getInitials = (name?: string, email?: string) => {
  const str = name || email || "?";
  const parts = str.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return str.substring(0, 2).toUpperCase();
};

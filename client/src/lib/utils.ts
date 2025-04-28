import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export const fileNameRgx = new RegExp(
  // 1) forbid reserved Windows device names (CON, PRN, AUX, NUL, COM1–COM9, LPT1–LPT9)
  '^(?!^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$)' +
  // 2) allow an optional single leading dot (for dotfiles), but not multiple dots-only
  '(?!\\.+$)' +
  // 3) forbid leading or trailing space or dot (except that leading dot IS allowed by the previous line)
  '(?!.*[ .]$)' +
  // 4) actual name characters: anything except control, slash, backslash, or these: <>:"|?*
  '[^<>:"/\\\\|?*\\r\\n]+' +
  '$',
  'i'
);
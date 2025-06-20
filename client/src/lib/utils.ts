import { Icons } from "@/components/icons";
import { ELanguage, TLoginResponse, TUser } from "@/types";
import { AxiosError } from "axios";
import { clsx, type ClassValue } from "clsx"
import { jwtDecode } from "jwt-decode";
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

type AccessTokenDecoded = {
  accountId: string,
  email: string,
  userId: string,
  deviceId: string,
  firstName: string,
  lastName: string,
  exp: number,
}

export function getUserFromLoginResponse(res: TLoginResponse): { user: TUser, exp: number } {
  const payload: AccessTokenDecoded = jwtDecode(res.access_token);

  return {
    user: {
      id: payload.accountId,
      email: payload.email,
      userId: payload.userId,
      deviceId: payload.deviceId,
      firstName: payload.firstName,
      lastName: payload.lastName,
    },
    exp: payload.exp
  };
}


export const languageFields = [
  {
    value: ELanguage.REACT_JS,
    label: "React + JS",
    icon: Icons.javascript
  },
  {
    value: ELanguage.REACT_TS,
    label: "React + TS",
    icon: Icons.tsx
  },
  {
    value: ELanguage.NEXT_TS,
    label: "Next + TS",
    icon: Icons.nextjs
  },
  {
    value: ELanguage.NODE_JS,
    label: "Node JS",
    icon: Icons.node
  },
  {
    value: ELanguage.PYTHON,
    label: "Python",
    icon: Icons.python
  },
  {
    value: ELanguage.C,
    label: "C Language",
    icon: Icons.c
  },
  {
    value: ELanguage.CPP,
    label: "C++",
    icon: Icons.cpp
  },
  {
    value: ELanguage.JAVA,
    label: "Java",
    icon: Icons.java
  },
]

export function createQueryString(params: Record<string, string | boolean | undefined | null>) {
  // Remove undefined values
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([key, value]) => !!value && !!key)
      .map(([key, value]) => [key, String(value)])
  );

  return new URLSearchParams(filteredParams).toString();
}

export function getErrMsg(error: unknown): string | null {
  if (error instanceof AxiosError) {

    const err = error.response?.data?.message;

    if (err instanceof Object && 'message' in err) {
      const msg = err.message;
      if (Array.isArray(msg)) return msg[0];
      return err.message;
    } else if (typeof err === 'string') {
      return err;
    } else {
      return null;
    }
  } else {
    return null;
  }
}
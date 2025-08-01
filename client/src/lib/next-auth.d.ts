import { TUser } from "@/types/types";

import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: TUser,
        backendTokens: {
            access_token: string,
            refresh_token: string,
            expiresIn: number;

        }
    }
}

import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
    interface JWT {
        user: TUser,

        backendTokens: {
            access_token: string,
            refresh_token: string,
            expiresIn: number;
        };
    }
}
import { TLoginResponse, TUser } from "@/types";

import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: TUser,
        access_token: string
    }

    interface User extends TUser {
        access_token: string
    }
}

import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        userId: string;
        email: string;
        firstName: string;
        lastName: string;
        access_token: string;
    }
}
import CredentialsProvider from "next-auth/providers/credentials";
import { User, NextAuthOptions } from "next-auth"
import { getUserFromLoginResponse } from "@/lib/utils";
import { TLoginResponse } from "@/types";
import { JWT } from "next-auth/jwt";
import axiosServer from "@/lib/axios-server";
import { AuthMessage, REFRESH_TOKEN_HEADER } from "@/lib/CONSTANTS";
import { signOut } from "next-auth/react";
import { redirect } from "next/navigation";

async function refreshToken(token: JWT): Promise<JWT> {
    const refreshToken = token.backendTokens.refresh_token;

    if (!refreshToken) signOut();

    const res = await axiosServer.post<TLoginResponse>(`/auth/refresh`, {}, {
        headers: {
            [REFRESH_TOKEN_HEADER]: token.backendTokens.refresh_token
        }
    });

    const data = res.data;

    if (!data) throw new Error("Invalid credentials");

    const { user, exp } = getUserFromLoginResponse(data);

    return {
        ...token,
        user,
        backendTokens: {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expiresIn: exp
        }
    }
}

export const authOptions: NextAuthOptions = {
    pages: {
        signIn: '/auth/login',
        signOut: '/',
    },
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                access_token: { label: "Access Token", type: "text", required: true },
                refresh_token: { label: "Refresh Token", type: "text", required: true },
            },
            async authorize(credentials) {
                if (!credentials) return null;

                try {
                    const { user, exp } = getUserFromLoginResponse({
                        access_token: credentials.access_token,
                        refresh_token: credentials.refresh_token
                    });
                    return {
                        user,
                        backendTokens: {
                            access_token: credentials.access_token,
                            refresh_token: credentials.refresh_token,
                            expiresIn: exp
                        }
                    } as unknown as User;

                } catch (e) {
                    console.log(e)
                    return null;
                }
            }
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) return { ...token, ...user };

            if ((Date.now() / 1000) < token.backendTokens.expiresIn) return token;

            return await refreshToken(token);
        },

        async session({ token, session }) {
            session.user = token.user;
            session.backendTokens = token.backendTokens;

            return session;
        }
    },
}
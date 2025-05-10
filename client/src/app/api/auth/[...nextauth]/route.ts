import { API_URL, getUserFromLoginResponse } from "@/lib/utils";
import axios from "axios";
import NextAuth, { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import { TLoginResponse } from "@/types";
import { JWT } from "next-auth/jwt";

export const authOptions: AuthOptions = {
    pages: {
        signIn: '/auth/login',
    },
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "name@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    const res = await axios.post<TLoginResponse>(`${API_URL}/auth/login`, {
                        email: credentials?.email,
                        password: credentials?.password,
                    });

                    const data = res.data;

                    if (!data) throw new Error("Invalid credentials");

                    const user = getUserFromLoginResponse(data);
                    return {
                        ...user,
                        access_token: data.access_token
                    };

                } catch (e) {
                    console.log(e)
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }): Promise<JWT> {
            if (user) {
                // When signing in, use the backend's access token as the JWT
                return {
                    id: user.id!,
                    userId: user.userId!,
                    email: user.email!,
                    firstName: user.firstName!,
                    lastName: user.lastName!,
                    access_token: user.access_token!
                };
            }

            return token;
        },

        async session({ token, session }) {
            session.user = {
                id: token.id,
                userId: token.userId,
                email: token.email,
                firstName: token.firstName,
                lastName: token.lastName,
            };
            session.access_token = token.access_token;

            return session;
        }
    },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST };
"use server"

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { API_URL } from "./utils";
import axios from "axios";

export async function serverFetch(path: string, init?: RequestInit) {
    const session = await getServerSession(authOptions);

    return fetch(`${API_URL}/${path}`, {
        headers: {
            'Authorization': `Bearer ${session?.backendTokens?.access_token}`
        },
        credentials: 'include',
        ...init,
    });
}

export default axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 10000, // Optional: 10 seconds timeout
});
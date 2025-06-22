"use server"

import { API_URL } from "./utils";
import axios from "axios";
import { auth } from "./auth";

export async function serverFetch(path: string, init?: RequestInit) {
    const session = await auth();

    if (init) {
        const { headers, ...rest } = init;

        return fetch(`${API_URL}${path}`, {
            headers: {
                ...headers,
                'Authorization': `Bearer ${session.backendTokens.access_token}`,
            },
            ...rest
        });
    }

    return fetch(`${API_URL}${path}`, {
        headers: {
            'Authorization': `Bearer ${session.backendTokens.access_token}`,
        },
    });
}

export default axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 10000, // Optional: 10 seconds timeout
});
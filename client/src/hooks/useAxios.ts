"use client";

import axios, { AxiosInstance } from "axios";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthMessage, REFRESH_TOKEN_HEADER } from "@/lib/CONSTANTS";
import { API_URL } from "@/lib/utils";
import { useMemo, useRef } from "react";

export const useAxiosPrivate = (): AxiosInstance => {
    const { data } = useSession();
    const router = useRouter();

    const access_token = data?.backendTokens?.access_token;
    const refresh_token = data?.backendTokens?.refresh_token;

    // A single shared instance, memoized so it’s not recreated on each render.
    const axiosInstance = useMemo(() => {
        return axios.create({
            baseURL: API_URL,
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            withCredentials: true,
        });
    }, [access_token]); // re-create if the access_token string changes

    const isRefreshing = useRef(false);
    const refreshSubscribers = useRef<((token: string) => void)[]>([]);

    const subscribeTokenRefresh = (cb: (token: string) => void) => {
        refreshSubscribers.current.push(cb);
    };

    const onRefreshed = (token: string) => {
        refreshSubscribers.current.forEach(cb => cb(token));
        refreshSubscribers.current = [];
    };

    useMemo(() => {
        const MAX_RETRIES = 3;

        const interceptor = axiosInstance.interceptors.response.use(
            response => response,
            async error => {
                if (
                    error?.response?.data?.message?.message ===
                    AuthMessage.INVALID_AUTH_CREDENTIALS_MSG
                ) {
                    toast.error(AuthMessage.INVALID_AUTH_CREDENTIALS_MSG);
                    return Promise.reject(error);
                }

                const originalRequest = error.config;

                // 1) 401 + not _retry
                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (isRefreshing.current) {
                        return new Promise(resolve => {
                            subscribeTokenRefresh((newToken: string) => {
                                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                resolve(axiosInstance(originalRequest));
                            });
                        });
                    }

                    originalRequest._retry = true;
                    isRefreshing.current = true;

                    try {
                        const response = await axios.post(
                            `${API_URL}/auth/refresh`,
                            {},
                            {
                                headers: {
                                    [REFRESH_TOKEN_HEADER]: refresh_token,
                                },
                            }
                        );

                        if (response.status === 200) {
                            const newAccessToken = response.data.access_token;
                            // Update default headers so future requests use the new token
                            axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                            // TODO: should update the next-auth session, but idk, using update() function reloads the coding page (/code)

                            onRefreshed(newAccessToken);
                            isRefreshing.current = false;
                            return axiosInstance(originalRequest);
                        }
                    } catch (err) {
                        isRefreshing.current = false;
                        router.push("/auth/login");
                        return Promise.reject(err);
                    }
                }

                // 2) 429 retry logic
                if (error.response?.status === 429) {
                    originalRequest._retryCount = originalRequest._retryCount || 0;
                    if (originalRequest._retryCount < MAX_RETRIES) {
                        originalRequest._retryCount += 1;
                        const retryAfter = error.response.headers["retry-after"];
                        const delay = retryAfter
                            ? parseInt(retryAfter) * 1000
                            : Math.min(1000 * 2 ** originalRequest._retryCount, 10000);
                        await new Promise(res => setTimeout(res, delay));
                        return axiosInstance(originalRequest);
                    }
                }

                return Promise.reject(error);
            }
        );

        // Eject on unmount / re-render
        return () => {
            axiosInstance.interceptors.response.eject(interceptor);
        };
    }, [axiosInstance, refresh_token, router]);

    return axiosInstance;
};
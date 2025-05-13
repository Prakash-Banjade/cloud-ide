import axios, { AxiosInstance } from "axios";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthMessage, REFRESH_TOKEN_HEADER } from "@/lib/CONSTANTS";
import { API_URL } from "@/lib/utils";

export const useAxiosPrivate = (): AxiosInstance => {
    const { data } = useSession();
    const router = useRouter();

    console.log(data?.backendTokens)

    const access_token = data?.backendTokens?.access_token;
    const refresh_token = data?.backendTokens?.refresh_token;

    const axiosInstance = axios.create({
        baseURL: API_URL,
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
        withCredentials: true,
        timeout: 10000, // Optional: 10 seconds timeout
    });

    const MAX_RETRIES = 3;

    // Token Refresh Lock: Prevents parallel refresh token requests.
    let isRefreshing = false;
    let refreshSubscribers: Array<(token: string) => void> = [];

    const subscribeTokenRefresh = (cb: (token: string) => void) => {
        refreshSubscribers.push(cb);
    };

    const onRefreshed = (token: string) => {
        refreshSubscribers.forEach((cb) => cb(token));
        refreshSubscribers = [];
    };

    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error?.response?.data?.message?.message === AuthMessage.INVALID_AUTH_CREDENTIALS_MSG) {
                return toast.error(AuthMessage.INVALID_AUTH_CREDENTIALS_MSG);
            }

            const originalRequest = error.config;

            if (error.response?.status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise((resolve) => {
                        subscribeTokenRefresh((newToken) => {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            resolve(axiosInstance(originalRequest));
                        });
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const response = await axios.post(
                        `${API_URL}/auth/refresh`,
                        {},
                        {
                            headers: {
                                [REFRESH_TOKEN_HEADER]: refresh_token
                            }
                        }
                    );

                    if (response?.status === 200) {
                        const newAccessToken = response.data.access_token;

                        axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                        onRefreshed(newAccessToken);
                        isRefreshing = false;

                        return axiosInstance(originalRequest);
                    }
                } catch (err) {
                    isRefreshing = false;
                    router.push('/auth/login');
                    return Promise.reject(err);
                }
            }

            if (error.response?.status === 429 && !originalRequest._retryCount) {
                originalRequest._retryCount = originalRequest._retryCount || 0;

                if (originalRequest._retryCount < MAX_RETRIES) {
                    originalRequest._retryCount += 1;

                    const retryAfter = error.response.headers["retry-after"];
                    const delay = retryAfter
                        ? parseInt(retryAfter) * 1000
                        : Math.min(1000 * 2 ** originalRequest._retryCount, 10000);

                    await new Promise((resolve) => setTimeout(resolve, delay));

                    return axiosInstance(originalRequest);
                }
            }

            return Promise.reject(error);
        }
    );

    return axiosInstance;
};
import axios, { AxiosInstance } from "axios";
import toast from "react-hot-toast";

// export const useAxiosPrivate = (): AxiosInstance => {
//     const { access_token, setAuth } = useAuth();

//     const axiosInstance = axios.create({
//         baseURL: process.env.NEXT_PUBLIC_API_URL,
//         headers: {
//             Authorization: `Bearer ${access_token}`,
//         },
//         withCredentials: true,
//         timeout: 10000, // Optional: 10 seconds timeout
//     });

//     const MAX_RETRIES = 3;

//     // Token Refresh Lock: Prevents parallel refresh token requests.
//     let isRefreshing = false;
//     let refreshSubscribers: Array<(token: string) => void> = [];

//     const subscribeTokenRefresh = (cb: (token: string) => void) => {
//         refreshSubscribers.push(cb);
//     };

//     const onRefreshed = (token: string) => {
//         refreshSubscribers.forEach((cb) => cb(token));
//         refreshSubscribers = [];
//     };

//     // axiosInstance.interceptors.response.use(
//     //     (response) => response,
//     //     async (error) => {
//     //         if (error?.response?.data?.message?.message === AuthMessage.INVALID_AUTH_CREDENTIALS_MSG) {
//     //             return toast.error(AuthMessage.INVALID_AUTH_CREDENTIALS_MSG);
//     //         }

//     //         const originalRequest = error.config;

//     //         if (error.response?.status === 401 && !originalRequest._retry) {
//     //             if (isRefreshing) {
//     //                 return new Promise((resolve) => {
//     //                     subscribeTokenRefresh((newToken) => {
//     //                         originalRequest.headers.Authorization = `Bearer ${newToken}`;
//     //                         resolve(axiosInstance(originalRequest));
//     //                     });
//     //                 });
//     //             }

//     //             originalRequest._retry = true;
//     //             isRefreshing = true;

//     //             try {
//     //                 const response = await axios.post(
//     //                     `${import.meta.env.VITE_API_URL}/${QueryKey.AUTH_REFRESH}`,
//     //                     {},
//     //                     { withCredentials: true }
//     //                 );

//     //                 if (response?.status === 200) {
//     //                     const newAccessToken = response.data.access_token;
//     //                     setAuth({ accessToken: newAccessToken, user: response.data.user });

//     //                     axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
//     //                     originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

//     //                     onRefreshed(newAccessToken);
//     //                     isRefreshing = false;

//     //                     return axiosInstance(originalRequest);
//     //                 }
//     //             } catch (err) {
//     //                 isRefreshing = false;
//     //                 setAuth(null); // Clear auth state if refresh fails
//     //                 navigate('/', { replace: true, state: { from: location } });
//     //                 return Promise.reject(err);
//     //             }
//     //         }

//     //         if (error.response?.status === 429 && !originalRequest._retryCount) {
//     //             originalRequest._retryCount = originalRequest._retryCount || 0;

//     //             if (originalRequest._retryCount < MAX_RETRIES) {
//     //                 originalRequest._retryCount += 1;

//     //                 const retryAfter = error.response.headers["retry-after"];
//     //                 const delay = retryAfter
//     //                     ? parseInt(retryAfter) * 1000
//     //                     : Math.min(1000 * 2 ** originalRequest._retryCount, 10000);

//     //                 await new Promise((resolve) => setTimeout(resolve, delay));

//     //                 return axiosInstance(originalRequest);
//     //             }
//     //         }

//     //         return Promise.reject(error);
//     //     }
//     // );

//     return axiosInstance;
// };


export const useAxios = (): AxiosInstance => {
    const axiosInstance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        withCredentials: true,
        timeout: 10000, // Optional: 10 seconds timeout
    });

    return axiosInstance;
}
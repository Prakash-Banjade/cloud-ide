"use client";

import { useMutation, UseMutationOptions, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { useAxiosPrivate } from './useAxios';

interface MutationParams<TData> {
    endpoint: string;
    invalidateTags?: string[];
    method: 'post' | 'patch' | 'delete';
    data?: TData;
    config?: AxiosRequestConfig;
    toastOnError?: boolean;
    toastOnSuccess?: boolean;
}

export const useAppMutation = <TData, TResponse>(options?: UseMutationOptions<AxiosResponse<TResponse>, unknown, MutationParams<TData>, unknown>):
    UseMutationResult<AxiosResponse<TResponse>, unknown, MutationParams<TData>> => {

    const queryClient = useQueryClient();
    const axios = useAxiosPrivate();

    return useMutation({
        mutationFn: async ({ endpoint, method, data, config }) => {
            try {
                const response = axios[method](endpoint, data, config);
                return response;
            } catch (error) {
                throw error;
            }
        },
        onError(error, { toastOnError = true }) {
            if (error instanceof AxiosError) {
                if (toastOnError) {
                    const message = error.response?.data?.message;
                    if (message instanceof Object && 'message' in message) {
                        toast.error(message.message);
                    } else if (typeof message === 'string') {
                        toast.error(message);
                    } else {
                        toast.error(error.message);
                    }
                }
            } else if (error instanceof Error && toastOnError) {
                toast.error(`${error.message}`);
            }
            console.log(error)
        },
        onSuccess(data, { invalidateTags, toastOnSuccess = true }) {
            if (invalidateTags?.length) {
                queryClient.invalidateQueries({
                    queryKey: invalidateTags,
                })
            }

            if (toastOnSuccess) {
                toast.success(data.data.message ?? 'Success!');
            }
        },
        ...options,
    })
};
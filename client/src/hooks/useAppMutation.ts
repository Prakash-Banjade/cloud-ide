import { useAxiosPrivate } from '@/lib/axios';
import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

interface MutationParams<TData> {
    endpoint: string;
    invalidateTags?: string[] | string[][];
    method: 'post' | 'patch' | 'delete';
    data?: TData;
    config?: AxiosRequestConfig;
    toastOnError?: boolean;
    toastOnSuccess?: boolean;
}

export const useAppMutation = <TData, TResponse>(): UseMutationResult<
    AxiosResponse<TResponse>,
    unknown,
    MutationParams<TData>
> => {
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
        onError(error, variables) {
            if (error instanceof AxiosError) {
                if (variables.toastOnError ?? true) {
                    const message = error.response?.data?.message;
                    if (message instanceof Object && 'message' in message) {
                        toast.error(message.message);
                    } else if (typeof message === 'string') {
                        toast.error(message);
                    } else {
                        toast.error(error.message);
                    }
                }
            } else if (error instanceof Error) {
                (variables.toastOnError ?? true) && toast.error(`${error.message}`);
            }
            console.log(error)
        },
        onSuccess(data, variables) {
            if (variables.invalidateTags) {
                if (variables.invalidateTags[0] instanceof Array) {
                    for (const tag of variables.invalidateTags) {
                        queryClient.invalidateQueries({
                            queryKey: tag as string[],
                        })
                    }
                } else {
                    queryClient.invalidateQueries({
                        queryKey: variables.invalidateTags as string[],
                    })
                }
            }

            (variables.toastOnSuccess ?? true) && toast.success(data.data.message ?? 'Success!');
        },
    })
};
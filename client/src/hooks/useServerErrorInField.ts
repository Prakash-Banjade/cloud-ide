import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";

export const useServerErrorInField = (error: unknown, form: UseFormReturn<any, any, any>) => {
    useEffect(() => { // show error directly in form field if send by server
        const errObj = (error as any)?.response?.data?.message;
        if (!!errObj?.field) {
            form.setError(errObj.field, { message: errObj?.message });
            form.setFocus(errObj.field);
        }
    }, [error]);
}
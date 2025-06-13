"use server";

import { AuthenticationResponseJSON } from "@simplewebauthn/browser";
import axiosServer from "../axios-server";
import { TLoginResponse } from "@/types";
import { loginFormSchemaType } from "@/app/auth/login/components/login-by-pwd-form";
export const webauthnVerifyLogin = async (authenticationResponse: AuthenticationResponseJSON, email: string) => {
    const response = await axiosServer.post<TLoginResponse>(`/web-authn/verify-login`, {
        authenticationResponse,
        email,
    });

    if (!response.data) throw new Error('Failed to login with passkey');

    return response.data;
};

export async function pwdLogin(values: loginFormSchemaType) {
    const res = await axiosServer.post<TLoginResponse>(`/auth/login`, values);

    if (!res.data) throw new Error("Invalid credentials");

    return res.data;
}
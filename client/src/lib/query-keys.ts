export enum QueryKey {
    AUTH_LOGIN = "auth/login",
    AUTH_REFRESH = "auth/refresh",
    AUTH_LOGOUT = "auth/logout",
    AUTH_FORGOT_PASSWORD = "auth/forgot-password",
    AUTH_RESET_PASSWORD = "auth/reset-password",
    AUTH_CHANGE_PASSWORD = "auth/change-password",
    AUTH_VERIFY_PWD_RESET_TOKEN = "auth/verify-pwd-reset-token",
    AUTH_VERIFY_EMAIL = "auth/verify-email",
    AUTH_VERIFY_EMAIL_CONFIRM_TOKEN = "auth/verify-email-confirm-token",
    AUTH_VERIFY_SUDO = "auth/verify-sudo",
    WEB_AUTHN = "web-authn",
    ACCOUNTS_DEVICES = "accounts/devices",
    TWOFA_STATUS = "accounts/2fa/status",

    PROJECTS = "projects",
    INVITES = "invites",
    COLLABORATORS = "collaborators",
}
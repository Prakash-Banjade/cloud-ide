export const enum AuthMessage {
    INVALID_AUTH_CREDENTIALS_MSG = 'Invalid email or password',
    DEVICE_NOT_FOUND = 'Invalid device identity',
    TOKEN_EXPIRED = "TokenExpiredError",
    REPORT_NOT_PUBLISHED = "Report not published yet",
};

export const REFRESH_TOKEN_HEADER = 'x-refresh-token' as const;

export const NAME_REGEX = /^[A-Za-z]+$/;

export const NAME_WITH_SPACE_REGEX = /^[A-Za-z]+( [A-Za-z]+)*$/;

export const RESEND_OTP_TIME_SEC = 60;

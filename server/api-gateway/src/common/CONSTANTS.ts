export const enum Tokens {
    REFRESH_TOKEN_COOKIE_NAME = 'refresh_token',
    SUDO_ACCESS_TOKEN_COOKIE_NAME = 'sudo_access_token',
}

export const REFRESH_TOKEN_HEADER = 'x-refresh-token' as const;

export const NAME_REGEX = /^[A-Za-z]+$/;
export const NAME_WITH_SPACE_REGEX = /^[A-Za-z]+( [A-Za-z]+)*$/;

export const BCRYPT_HASH = /^\$2[aby]?\$[0-9]{2}\$[./A-Za-z0-9]{53}$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const enum AuthMessage {
    INVALID_AUTH_CREDENTIALS = 'Invalid email or password',
    DEVICE_NOT_FOUND = 'Invalid device identity',
    TOKEN_EXPIRED = "TokenExpiredError",
    REPORT_NOT_PUBLISHED = "Report not published yet",
    PASSWORD_NOT_SET_YET = "Password not set yet",
    OTP_SENT_MESSAGE = "An OTP has been sent to your email. Please use the OTP to verify your account."
};

export const MAX_PREV_PASSWORDS = 3 as const;

export const PASSWORD_SALT_COUNT = 12 as const;
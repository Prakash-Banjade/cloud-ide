export const PHONE_NUMBER_REGEX = /^\+?(\d{1,3})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;

export const PHONE_NUMBER_REGEX_STRING = '^\+?(\d{1,3})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$'

export const enum AuthMessage {
    INVALID_AUTH_CREDENTIALS_MSG = 'Invalid email or password',
    DEVICE_NOT_FOUND = 'Invalid device identity',
    TOKEN_EXPIRED = "TokenExpiredError",
    REPORT_NOT_PUBLISHED = "Report not published yet",
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NAME_REGEX = /^[A-Za-z]+$/;

export const NAME_WITH_SPACE_REGEX = /^[A-Za-z]+( [A-Za-z]+)*$/;

export const NUMBER_REGEX_STRING = '^[0-9]*$'

export const RESEND_OTP_TIME_SEC = 60;

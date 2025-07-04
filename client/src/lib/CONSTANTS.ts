import { ELanguage } from "@/types";

export const enum AuthMessage {
    INVALID_AUTH_CREDENTIALS_MSG = 'Invalid email or password',
    DEVICE_NOT_FOUND = 'Invalid device identity',
    TOKEN_EXPIRED = "TokenExpiredError",
    REPORT_NOT_PUBLISHED = "Report not published yet",
    OTP_SENT_MESSAGE = "An OTP has been sent to your email. Please use the OTP to verify your account."
};

export const REFRESH_TOKEN_HEADER = 'x-refresh-token' as const;

export const NAME_REGEX = /^[A-Za-z]+$/;

export const NAME_WITH_SPACE_REGEX = /^[A-Za-z]+( [A-Za-z]+)*$/;

export const RESEND_OTP_TIME_SEC = 60;

export const previewLanguages = [
    ELanguage.NEXT_TS,
    ELanguage.REACT_TS,
    ELanguage.REACT_JS,
    ELanguage.NODE_JS,
]

export const enum SocketEvents {
    TREE_LOADED = "loaded",
    FETCH_CONTENT = "content:fetch",
    FETCH_DIR = "dir:fetch",
    CREATE_ITEM = "item:create",
    DELETE_ITEM = "item:delete",
    UPDATE_CONTENT = "content:update",
    RENAME_ITEM = "item:rename",

    PROCESS_STATUS = "process:status",
    PROCESS_RUN = "process:run",
    PROCESS_STOP = "process:stop",
    TERMINAL_REQUEST = "terminal:request",
    TERMINAL = "terminal",
    TERMINAL_DATA = "terminal:data",
}
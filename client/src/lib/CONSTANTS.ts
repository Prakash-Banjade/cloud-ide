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
    FETCH_CONTENT = "fetchContent",
    FETCH_DIR = "fetchDir",
    PROCESS_STATUS = "process:status",
    PROCESS_RUN = "process:run",
    PROCESS_STOP = "process:stop",
    TREE_LOADED = "loaded",

    CREATE_ITEM = "createItem",
    DELETE_ITEM = "deleteItem",
    UPDATE_CONTENT = "updateContent",
    RENAME_ITEM = "renameItem",

    REQUEST_TERMINAL = "requestTerminal",
    TERMINAL = "terminal",
    TERMINAL_DATA = "terminalData"
}
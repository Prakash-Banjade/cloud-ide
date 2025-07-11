export const PROJECT_PATH = '/workspace' as const;


export const enum SocketEvents {
    PROCESS_STATUS = "process:status",
    PROCESS_RUN = "process:run",
    PROCESS_STOP = "process:stop",
    TERMINAL_REQUEST = "terminal:request",
    TERMINAL = "terminal",
    TERMINAL_DATA = "terminal:data",
}
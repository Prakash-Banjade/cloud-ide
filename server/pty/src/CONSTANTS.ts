export const PROJECT_PATH = '/workspace' as const;


export const enum SocketEvents {
    PROCESS_STATUS = "process:status",
    PROCESS_RUN = "process:run",
    PROCESS_STOP = "process:stop",
    REQUEST_TERMINAL = "requestTerminal",
    TERMINAL = "terminal",
    TERMINAL_DATA = "terminalData"
}
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
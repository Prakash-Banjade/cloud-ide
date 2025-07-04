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
}
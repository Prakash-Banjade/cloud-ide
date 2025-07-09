export const enum SocketEvents {
    TREE_LOADED = "loaded",
    FETCH_CONTENT = "content:fetch",
    FETCH_DIR = "dir:fetch",
    CREATE_ITEM = "item:create",
    DELETE_ITEM = "item:delete",
    UPDATE_CONTENT = "content:update",
    RENAME_ITEM = "item:rename",

    ITEM_CREATED = "item:created",
    ITEM_DELETED = "item:deleted",
    ITEM_UPDATED = "item:updated",
    ITEM_RENAMED = "item:renamed",

    PROCESS_STATUS = "process:status",
    PROCESS_RUN = "process:run",
    PROCESS_STOP = "process:stop",

    USERS_ACTIVE = "users:active",
    CURSOR_MOVE = "cursor:move",
    USER_LEFT = "user:left",
    SELECTION_CHANGE = "selection:change",
}
export const WORKSPACE_PATH = '/workspace' as const;

export const enum SocketEvents {
    TREE_LOADED = "loaded",
    FETCH_CONTENT = "content:fetch",
    FETCH_DIR = "dir:fetch",
    CREATE_ITEM = "item:create",
    DELETE_ITEM = "item:delete",
    UPDATE_CONTENT = "content:update",
    RENAME_ITEM = "item:rename",

    FILE_CREATED = "file:created",
    FILE_REMOVED = "file:removed",
    DIR_CREATED = "dir:created",
    DIR_REMOVED = "dir:removed",
    FILE_CHANGED = "file:changed",

    USERS_ACTIVE = "users:active",
    CURSOR_MOVE = "cursor:move",
    USER_LEFT = "user:left",
    SELECTION_CHANGE = "selection:change",
    CODE_CHANGE = "code:change",
}
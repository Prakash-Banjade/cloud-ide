export enum ELanguage {
    PYTHON = 'python',
    NODE_JS = 'node-js',
    C = "c",
    CPP = "cpp",
    REACT_JS = "react-js",
    REACT_TS = "react-ts"
}

export type TUser = {
    id: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
}

export interface TLoginResponse {
    access_token: string,
    user: Pick<TUser, "firstName" | "lastName">;
}
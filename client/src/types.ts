export enum ELanguage {
    PYTHON = 'python',
    NODE_JS = 'node-js',
    C = "c",
    CPP = "cpp",
    REACT_JS = "react-js",
    REACT_TS = "react-ts"
}

export type TCurrentUser = {
    firstName: string,
    lastName: string,
    profileImageUrl: string | null,
    branchName: string | null,
} | undefined
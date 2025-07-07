export enum ELanguage {
    PYTHON = 'python',
    NODE_JS = 'node-js',
    C = "c",
    CPP = "cpp",
    REACT_JS = "react-js",
    REACT_TS = "react-ts",
    NEXT_TS = "next-ts",
    JAVA = "java",
}

export type TUser = {
    id: string,
    userId: string,
    email: string,
    deviceId: string,
    firstName: string,
    lastName: string,
}

export interface TLoginResponse {
    access_token: string,
    refresh_token: string,
}

export type TMeta = {
    page: number;
    take: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
};

export type TProject = {
    id: string
    name: string,
    language: ELanguage
    replId: string,
    collaboratorsCount: number,
    createdAt: string,
    updatedAt: string;
}

export type TProjectsResponse = {
    data: TProject[]
    meta: TMeta;
}

export type TWebAuthnCredential = {
    id: string,
    createdAt: string,
    name: string,
    lastUsed: string | null,
}

export type TLoginDevice = {
    ua: string,
    deviceId: string,
    firstLogin: string,
    lastActivityRecord: string,
    current: boolean,
    signedIn: boolean,
}

export enum EPasskeyChallengeType {
    Register = 'register',
    Login = 'login',
    Sudo = 'sudo',
    TwoFaVerify = 'twofa_verify'
}

export enum ECollaboratorStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined'
}

export enum ECollaboratorPermission {
    READ = 'read',
    WRITE = 'write'
}

export type TCollaborator = {
    id: string,
    email: string,
    user: {
        id: string,
        account: {
            id: string,
            firstName: string,
            lastName: string,
        }
    } | null,
    permission: ECollaboratorPermission,
    status: ECollaboratorStatus
}
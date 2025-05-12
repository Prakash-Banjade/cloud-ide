export class EmailVerificationMailDto {
    receiverEmail: string;
    receiverName: string;
    token: string;
    otp: number;
    expirationMin: number;

    constructor(dto: EmailVerificationMailDto) {
        Object.assign(this, dto);
    }
}

export class TwoFAMailEventDto {
    receiverEmail: string;
    receiverName: string;
    otp: number;
    expirationMin: number;
    constructor(dto: TwoFAMailEventDto) {
        Object.assign(this, dto);
    }
}

export class ResetPasswordMailEventDto {
    receiverEmail: string;
    receiverName: string;
    token: string;

    constructor(dto: ResetPasswordMailEventDto) {
        Object.assign(this, dto);
    }
}

export class UserCredentialsEventDto {
    email: string;
    password: string;
    username: string;

    constructor(dto: UserCredentialsEventDto) {
        Object.assign(this, dto);
    }
}
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { EncryptionService } from "src/auth-system/encryption/encryption.service";
import { EnvService } from "src/env/env.service";
import * as crypto from 'crypto';

@Injectable()
export class InvitesHelperService {
    constructor(
        private readonly encryptionService: EncryptionService,
        private readonly jwtService: JwtService,
        private readonly envService: EnvService,
    ) { }

    generateLink(projectId: string) {
        const token = this.jwtService.sign(
            { projectId },
            {
                secret: this.envService.INVITATION_SECRET,
                expiresIn: this.envService.INVITATION_EXPIRATION_SEC,
            }
        );

        const expiresIn = Date.now() + (this.envService.INVITATION_EXPIRATION_SEC * 1000);

        const encryptedToken = this.encryptionService.encrypt(token);

        const tokenHash = crypto
            .createHash('sha256')
            .update(encryptedToken)
            .digest('hex');

        const invitationLink = `${this.envService.CLIENT_URL}/invite?token=${encryptedToken}`;

        return {
            invitationLink,
            tokenHash,
            expiresIn
        }
    }

    validateToken(encryptedToken: string) {
        const tokenHash = crypto
            .createHash('sha256')
            .update(encryptedToken)
            .digest('hex');

        try {
            const decryptedToken = this.encryptionService.decrypt(encryptedToken);
            const payload = this.jwtService.verify(decryptedToken, { // verify if the jwt is valid
                secret: this.envService.INVITATION_SECRET,
            });

            return { payload, tokenHash, error: null };
        } catch (e) {
            return { payload: null, tokenHash: null, error: e };
        }
    }
}
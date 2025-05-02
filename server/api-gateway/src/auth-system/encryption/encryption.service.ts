import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
    constructor(
        private readonly configService: ConfigService,
    ) { }

    private readonly algorithm = 'aes-256-cbc';
    private readonly aes_iv = Buffer.from(this.configService.getOrThrow<string>('AES_IV'), 'hex'); // 16 bytes IV, needs to be exact 16 bytes buffer
    private readonly aes_key = Buffer.from(this.configService.getOrThrow<string>('AES_KEY'), 'hex'); // 32 bytes key

    public encrypt(data: string) {
        const cipher = crypto.createCipheriv(this.algorithm, this.aes_key, this.aes_iv); // Create cipher with algorithm, key, and IV
        let encrypted = cipher.update(data, 'utf8', 'hex'); // Encrypt text
        encrypted += cipher.final('hex'); // Finalize encryption
        return encrypted; // Return encrypted hex string
    }

    public decrypt(cipherText: string) {
        // Ensure that the cipherText is in 'hex' format
        const decipher = crypto.createDecipheriv(this.algorithm, this.aes_key, this.aes_iv); // Create decipher
        let decrypted = decipher.update(cipherText, 'hex', 'utf8'); // Decrypt text from 'hex' to 'utf8'
        decrypted += decipher.final('utf8'); // Finalize decryption
        return decrypted;
    }
}

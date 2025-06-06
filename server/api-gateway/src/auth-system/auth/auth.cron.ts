import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cron } from "@nestjs/schedule";
import { OtpVerificationPending } from "./entities/otp-verification-pending.entity";

export class AuthCron {
    constructor(
        @InjectRepository(OtpVerificationPending) private readonly otpVerificationPendingRepo: Repository<OtpVerificationPending>,
    ) { }

    @Cron('0 */15 * * * *') // runs every 15 minutes
    removeOtps() {
        console.log("Removing old otps...");

        // removing otps that are older than 15 minutes
        return this.otpVerificationPendingRepo.createQueryBuilder()
            .where('createdAt < :date', { date: new Date(new Date().setMinutes(new Date().getMinutes() - 15)) }) // perfectly worked
            .delete()
            .execute();
    }
}
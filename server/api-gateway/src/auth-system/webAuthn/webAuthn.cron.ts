import { InjectRepository } from "@nestjs/typeorm";
import { PasskeyChallenge } from "./entities/passkey-challenge.entity";
import { Repository } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EnvService } from "src/env/env.service";

export class WebAuthnCron {
    constructor(
        @InjectRepository(PasskeyChallenge) private readonly passkeyChallengeRepo: Repository<PasskeyChallenge>,
        private readonly envService: EnvService,
    ) { }

    @Cron(CronExpression.EVERY_6_HOURS)
    removeGarbagePasskeyChallenges() {
        console.log('Removing garbage passkey challenges...');

        return this.passkeyChallengeRepo.createQueryBuilder()
            .where('createdAt < :date', { date: new Date(new Date().setMinutes(new Date().getMinutes() - (this.envService.SUDO_ACCESS_TOKEN_EXPIRATION_SEC / 60))) }) // perfectly worked
            .delete()
            .execute();
    }
}
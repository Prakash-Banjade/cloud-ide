import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LoginDevice } from "./entities/login-devices.entity";
import { Cron, CronExpression } from "@nestjs/schedule";
import { sub } from "date-fns";

export class AccountsCronJob {
    constructor(
        @InjectRepository(LoginDevice) private readonly devicesRepo: Repository<LoginDevice>,
    ) { }

    // remove inactive login devices that has no activity for 28 days
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async removeInactiveDevices() {
        console.log('Removing inactive devices...');

        return this.devicesRepo.createQueryBuilder()
            .where('lastActivityRecord < :date', { date: sub(new Date(), { days: 28 }) })
            .delete()
            .execute();

    }
}
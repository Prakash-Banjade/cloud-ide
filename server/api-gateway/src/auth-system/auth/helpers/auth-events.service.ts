import { Injectable, UnauthorizedException } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { LoginDevice } from "src/auth-system/accounts/entities/login-devices.entity";
import { Repository } from "typeorm";

export enum EAuthEvents {
    DEVICE_ACTIVITY_UPDATE = 'device_activity_update'
}

@Injectable()
export class AuthEventsService {
    constructor(
        @InjectRepository(LoginDevice) private devicesRepo: Repository<LoginDevice>
    ) { }

    @OnEvent(EAuthEvents.DEVICE_ACTIVITY_UPDATE)
    async updateDeviceActivity({ deviceId }: { deviceId: string }) {
        const result = await this.devicesRepo.update({ deviceId }, { lastActivityRecord: new Date() });

        if (result.affected === 0) throw new UnauthorizedException("Device not recognized");
    }
}
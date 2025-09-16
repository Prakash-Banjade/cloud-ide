import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { StreamingService } from './streaming.service';

@Controller('stream')
export class StreamingController {
    constructor(private readonly streamingService: StreamingService) { }

    @Sse()
    stream(): Observable<MessageEvent> {
        return this.streamingService.getStream().pipe(
            map((data) => ({
                data,
            }) as MessageEvent),
        );
    }
}

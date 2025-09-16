import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class StreamingService {
    private subject = new Subject<string>();

    getStream(): Observable<string> {
        return this.subject.asObservable();
    }

    emitData(data: string): void {
        this.subject.next(data);
    }
}

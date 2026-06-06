import { Injectable, MessageEvent } from '@nestjs/common';
import type { SSEEvent } from '@fin-ai/shared/chat';
import { Observable, Subject, finalize, filter, map } from 'rxjs';

interface UserEvent {
  userId: number;
  payload: SSEEvent;
}

@Injectable()
export class StreamService {
  private readonly events = new Subject<UserEvent>();

  emit(userId: number, payload: SSEEvent) {
    this.events.next({ userId, payload });
  }

  stream(userId: number): Observable<MessageEvent> {
    return this.events.asObservable().pipe(
      filter((event) => event.userId === userId),
      map((event) => ({ data: event.payload })),
      finalize(() => undefined),
    );
  }
}

import { Injectable, MessageEvent } from '@nestjs/common';
import type { SSEEvent } from '@fin-ai/shared/chat';
import { Observable, Subject, finalize, filter, map } from 'rxjs';

interface UserEvent {
  userId: number;
  payload: SSEEvent;
}

interface GroupEvent {
  groupId: number;
  payload: SSEEvent;
}

@Injectable()
export class StreamService {
  private readonly events = new Subject<UserEvent>();
  private readonly groupEvents = new Subject<GroupEvent>();

  emit(userId: number, payload: SSEEvent) {
    this.events.next({ userId, payload });
  }

  emitGroup(groupId: number, payload: SSEEvent) {
    this.groupEvents.next({ groupId, payload: { ...payload, groupId } });
  }

  stream(userId: number): Observable<MessageEvent> {
    return this.events.asObservable().pipe(
      filter((event) => event.userId === userId),
      map((event) => ({ data: event.payload })),
      finalize(() => undefined),
    );
  }

  streamGroup(groupId: number): Observable<MessageEvent> {
    return this.groupEvents.asObservable().pipe(
      filter((event) => event.groupId === groupId),
      map((event) => ({ data: event.payload })),
      finalize(() => undefined),
    );
  }
}

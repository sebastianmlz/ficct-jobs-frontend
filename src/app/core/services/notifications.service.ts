import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { NotificationItem } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(ApiService);
  private readonly itemsSignal = signal<NotificationItem[]>([]);
  readonly items = this.itemsSignal.asReadonly();

  refresh(unreadOnly = false): Observable<NotificationItem[]> {
    return this.api
      .get<NotificationItem[]>(`/admin/notifications/me/${unreadOnly ? '?unread=true' : ''}`)
      .pipe(tap((items) => this.itemsSignal.set(items)));
  }

  markRead(id: string): Observable<NotificationItem> {
    return this.api.post<NotificationItem>(`/admin/notifications/${id}/read/`, {});
  }
}

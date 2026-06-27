import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, Subscription, interval, of } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type NotificationType =
  | 'MISSION_SOUMISE'
  | 'MISSION_VALIDEE'
  | 'MISSION_ANNULEE'
  | 'MISSION_CLOTUREE'
  | 'AFFECTATION_CREEE'
  | 'AFFECTATION_SUPPRIMEE'
  | 'ABSENCE_DECLAREE';

export interface NotificationView {
  idNotification: number;
  type: NotificationType;
  titre: string;
  message: string;
  idMission?: number | null;
  lue: boolean;
  dateCreation: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API_URL = `${environment.apiUrl}/notifications`;
  private readonly stop$ = new Subject<void>();

  /** Signaux réactifs pour binder facilement dans les templates. */
  readonly unreadCount = signal<number>(0);
  readonly notifications = signal<NotificationView[]>([]);

  private pollingSub?: Subscription;

  constructor(private readonly http: HttpClient) {}

  /** Démarre le polling backend toutes les 30 secondes. */
  startPolling(intervalMs = 30000): void {
    this.stopPolling();
    this.refreshAll();
    this.pollingSub = interval(intervalMs)
      .pipe(
        takeUntil(this.stop$),
        switchMap(() => this.fetchCountUnread()),
        catchError(() => of({ count: 0 }))
      )
      .subscribe();
  }

  stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
  }

  /** Force un refresh complet (compteur + liste). */
  refreshAll(): void {
    this.fetchCountUnread().subscribe();
    this.fetchNotifications().subscribe();
  }

  fetchNotifications(limit = 20): Observable<NotificationView[]> {
    return this.http.get<NotificationView[]>(`${this.API_URL}?limit=${limit}`).pipe(
      tap((notifs) => this.notifications.set(notifs)),
      catchError(() => {
        this.notifications.set([]);
        return of([]);
      })
    );
  }

  fetchCountUnread(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API_URL}/count-unread`).pipe(
      tap((res) => this.unreadCount.set(res?.count ?? 0)),
      catchError(() => {
        this.unreadCount.set(0);
        return of({ count: 0 });
      })
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/lu`, {}).pipe(
      tap(() => {
        const current = this.notifications();
        this.notifications.set(
          current.map((n) => (n.idNotification === id ? { ...n, lue: true } : n))
        );
        const newUnread = Math.max(0, this.unreadCount() - 1);
        this.unreadCount.set(newUnread);
      })
    );
  }

  markAllAsRead(): Observable<{ updated: number }> {
    return this.http.patch<{ updated: number }>(`${this.API_URL}/mark-all-read`, {}).pipe(
      tap(() => {
        this.notifications.set(this.notifications().map((n) => ({ ...n, lue: true })));
        this.unreadCount.set(0);
      })
    );
  }

  reset(): void {
    this.stopPolling();
    this.unreadCount.set(0);
    this.notifications.set([]);
  }
}

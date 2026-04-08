import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { SupportTimeRecord } from '../models/support-time.model';

const NOTIFICATIONS_KEY = 'support_notifications';

export interface Notification {
  id: string;
  message: string;
  recordId: string;
  isRead: boolean;
  createdAt: string;
  forRole: 'manager' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class SupportTimeService {
  private http = inject(HttpClient);
  private _records$ = new BehaviorSubject<SupportTimeRecord[]>([]);
  private _notifications$ = new BehaviorSubject<Notification[]>(this.loadNotifications());

  records$ = this._records$.asObservable();
  notifications$ = this._notifications$.asObservable();

  get records(): SupportTimeRecord[] {
    return this._records$.getValue();
  }

  get notifications(): Notification[] {
    return this._notifications$.getValue();
  }

  get pendingCount(): number {
    return this._notifications$.getValue().filter(n => !n.isRead).length;
  }

  constructor() {
    this.refresh();
  }

  // Notifications stay in localStorage for now (per-device, real-time push would need WebSockets)
  private loadNotifications(): Notification[] {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    this._notifications$.next(notifications);
  }

  async refresh(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<any[]>('/api/support-time'));
      const records: SupportTimeRecord[] = (data || []).map(r => ({
        id: r.id,
        userId: r.userId,
        userName: r.userName,
        startDate: r.startDate,
        endDate: r.endDate,
        startTime: r.startTime,
        endTime: r.endTime,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
        reviewedBy: r.reviewedBy || undefined,
        reviewedAt: r.reviewedAt || undefined,
        rejectReason: r.rejectReason || undefined,
      }));
      this._records$.next(records);
    } catch (err) {
      console.error('Failed to load support time records:', err);
    }
  }

  async addRecord(partial: Omit<SupportTimeRecord, 'id' | 'createdAt' | 'status'>): Promise<SupportTimeRecord> {
    const record = await firstValueFrom(
      this.http.post<SupportTimeRecord>('/api/support-time', partial)
    );
    await this.refresh();

    // Add local notification for manager
    const notification: Notification = {
      id: Date.now().toString() + '_notif',
      message: `${partial.userName} đã đăng ký hỗ trợ từ ${partial.startDate} đến ${partial.endDate}`,
      recordId: record.id,
      isRead: false,
      createdAt: new Date().toISOString(),
      forRole: 'manager'
    };
    this.saveNotifications([notification, ...this.notifications]);

    return record;
  }

  async approve(id: string, reviewerName: string): Promise<void> {
    await firstValueFrom(
      this.http.put('/api/support-time', { id, action: 'approve', reviewedBy: reviewerName })
    );
    await this.refresh();
    this.markNotificationRead(id);
  }

  async reject(id: string, reviewerName: string, rejectReason: string): Promise<void> {
    await firstValueFrom(
      this.http.put('/api/support-time', { id, action: 'reject', reviewedBy: reviewerName, rejectReason })
    );
    await this.refresh();
    this.markNotificationRead(id);
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/support-time?id=${id}`));
    await this.refresh();
  }

  markNotificationRead(recordId: string): void {
    const updated = this.notifications.map(n =>
      n.recordId === recordId ? { ...n, isRead: true } : n
    );
    this.saveNotifications(updated);
  }

  markAllRead(): void {
    const updated = this.notifications.map(n => ({ ...n, isRead: true }));
    this.saveNotifications(updated);
  }

  getUnreadForManager(): Notification[] {
    return this.notifications.filter(n => n.forRole === 'manager' && !n.isRead);
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => n.forRole === 'manager' && !n.isRead).length;
  }
}

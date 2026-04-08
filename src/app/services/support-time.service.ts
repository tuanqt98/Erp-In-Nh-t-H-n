import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupportTimeRecord } from '../models/support-time.model';

const STORAGE_KEY = 'support_time_records';
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
  private _records$ = new BehaviorSubject<SupportTimeRecord[]>(this.load());
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

  private load(): SupportTimeRecord[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private save(records: SupportTimeRecord[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    this._records$.next(records);
  }

  private loadNotifications(): Notification[] {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    this._notifications$.next(notifications);
  }

  addRecord(partial: Omit<SupportTimeRecord, 'id' | 'createdAt' | 'status'>): SupportTimeRecord {
    const newRecord: SupportTimeRecord = {
      ...partial,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    const updated = [newRecord, ...this.records];
    this.save(updated);

    // Add notification for manager
    const notification: Notification = {
      id: Date.now().toString() + '_notif',
      message: `${partial.userName} đã đăng ký hỗ trợ từ ${partial.startDate} đến ${partial.endDate}`,
      recordId: newRecord.id,
      isRead: false,
      createdAt: new Date().toISOString(),
      forRole: 'manager'
    };
    this.saveNotifications([notification, ...this.notifications]);

    return newRecord;
  }

  approve(id: string, reviewerName: string): void {
    const updated = this.records.map(r =>
      r.id === id
        ? { ...r, status: 'approved' as const, reviewedAt: new Date().toISOString(), reviewedBy: reviewerName }
        : r
    );
    this.save(updated);
    this.markNotificationRead(id);
  }

  reject(id: string, reviewerName: string, rejectReason: string): void {
    const updated = this.records.map(r =>
      r.id === id
        ? { ...r, status: 'rejected' as const, reviewedAt: new Date().toISOString(), reviewedBy: reviewerName, rejectReason }
        : r
    );
    this.save(updated);
    this.markNotificationRead(id);
  }

  delete(id: string): void {
    this.save(this.records.filter(r => r.id !== id));
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

  refresh(): void {
    this._records$.next(this.load());
    this._notifications$.next(this.loadNotifications());
  }
}

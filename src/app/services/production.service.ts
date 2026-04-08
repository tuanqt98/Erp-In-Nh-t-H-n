import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProductionRecord } from '../models/production.model';

const STORAGE_KEY = 'san_luong_records';
const STAGES_KEY = 'san_luong_stages';
import { CONG_DOAN_OPTIONS } from '../models/production.model';

// Empty initial data

@Injectable({ providedIn: 'root' })
export class ProductionService {
  private _records$ = new BehaviorSubject<ProductionRecord[]>([]);
  private _stages$ = new BehaviorSubject<string[]>([]);

  get records$(): Observable<ProductionRecord[]> {
    return this._records$.asObservable();
  }

  get stages$(): Observable<string[]> {
    return this._stages$.asObservable();
  }

  get records(): ProductionRecord[] {
    return this._records$.getValue();
  }

  constructor() {
    this.loadFromStorage();
    this.loadStages();
  }

  private loadStages(): void {
    const raw = localStorage.getItem(STAGES_KEY);
    if (raw) {
      try {
        this._stages$.next(JSON.parse(raw));
      } catch {
        this._stages$.next([...CONG_DOAN_OPTIONS]);
      }
    } else {
      this._stages$.next([...CONG_DOAN_OPTIONS]);
      this.saveStages();
    }
  }

  private saveStages(): void {
    localStorage.setItem(STAGES_KEY, JSON.stringify(this._stages$.getValue()));
  }

  addStage(name: string): void {
    const current = this._stages$.getValue();
    if (!current.includes(name)) {
      const updated = [...current, name];
      this._stages$.next(updated);
      this.saveStages();
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProductionRecord[];
        this._records$.next(parsed);
      } else {
        // Initialize with empty data
        this._records$.next([]);
        this.saveToStorage();
      }
    } catch {
      this._records$.next([]);
    }
  }

  clearAll(): void {
    this._records$.next([]);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._records$.getValue()));
  }

  addRecord(record: Omit<ProductionRecord, 'id' | 'createdAt'>): void {
    const newRecord: ProductionRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    const updated = [newRecord, ...this._records$.getValue()];
    this._records$.next(updated);
    this.saveToStorage();
  }

  updateRecord(recordOrId: ProductionRecord | string, changes?: Partial<ProductionRecord>): void {
    let updated: ProductionRecord[];
    if (typeof recordOrId === 'string') {
      // Legacy: updateRecord(id, changes)
      updated = this._records$.getValue().map(r =>
        r.id === recordOrId ? { ...r, ...changes } : r
      );
    } else {
      // New: updateRecord(fullRecord)
      updated = this._records$.getValue().map(r =>
        r.id === recordOrId.id ? { ...r, ...recordOrId } : r
      );
    }
    this._records$.next(updated);
    this.saveToStorage();
  }

  deleteRecord(id: string): void {
    const updated = this._records$.getValue().filter(r => r.id !== id);
    this._records$.next(updated);
    this.saveToStorage();
  }

  getTotalOK(): number {
    return this._records$.getValue().reduce((sum, r) => sum + r.sanLuongOK, 0);
  }

  getTotalLoi(): number {
    return this._records$.getValue().reduce((sum, r) => sum + r.sanLuongLoi, 0);
  }

  getTodayCount(): number {
    const today = new Date().toISOString().split('T')[0];
    return this._records$.getValue().filter(r => r.ngaySanXuat === today).length;
  }

  refresh(): void {
    this.loadFromStorage();
    this.loadStages();
  }
}

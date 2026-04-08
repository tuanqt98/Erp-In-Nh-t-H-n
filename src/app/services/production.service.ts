import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ProductionRecord } from '../models/production.model';

@Injectable({ providedIn: 'root' })
export class ProductionService {
  private http = inject(HttpClient);
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
    this.refresh();
  }

  async refresh(): Promise<void> {
    await Promise.all([this.loadRecords(), this.loadStages()]);
  }

  private async loadRecords(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<any[]>('/api/production'));
      const records: ProductionRecord[] = (data || []).map(r => ({
        id: r.id,
        ngaySanXuat: r.ngaySanXuat,
        tenNhanVien: r.tenNhanVien || r.employee?.tenNhanVien || r.employee?.maNhanVien || '',
        lenhSanXuat: r.lenhSanXuat,
        maHang: r.maHang,
        tenHang: r.tenHang,
        nguyenVatLieu: r.nguyenVatLieu || '',
        congDoan: r.congDoan,
        tenMay: r.tenMay,
        sanLuongOK: r.sanLuongOK,
        sanLuongLoi: r.sanLuongLoi,
        thoiGianBatDau: r.thoiGianBatDau || undefined,
        thoiGianKetThuc: r.thoiGianKetThuc || undefined,
        thoiGianSanXuat: r.thoiGianSanXuat,
        ghiChu: r.ghiChu || '',
        createdAt: new Date(r.createdAt).getTime(),
        // Keep employeeId for API calls
        employeeId: r.employeeId,
      }));
      this._records$.next(records);
    } catch (err) {
      console.error('Failed to load production records:', err);
    }
  }

  private async loadStages(): Promise<void> {
    try {
      const stages = await firstValueFrom(this.http.get<string[]>('/api/stages'));
      this._stages$.next(stages || []);
    } catch (err) {
      console.error('Failed to load stages:', err);
    }
  }

  async addStage(name: string): Promise<void> {
    const current = this._stages$.getValue();
    if (!current.includes(name)) {
      await firstValueFrom(this.http.post('/api/stages', { name }));
      this._stages$.next([...current, name]);
    }
  }

  async clearAll(): Promise<void> {
    await firstValueFrom(this.http.post('/api/production', { action: 'clearAll' }));
    this._records$.next([]);
  }

  async addRecord(record: Omit<ProductionRecord, 'id' | 'createdAt'>): Promise<void> {
    // Map tenNhanVien to employeeId for the API
    const data: any = { ...record };
    // employeeId should be provided by the form
    await firstValueFrom(this.http.post('/api/production', data));
    await this.loadRecords();
  }

  async updateRecord(recordOrId: ProductionRecord | string, changes?: Partial<ProductionRecord>): Promise<void> {
    let updateData: any;
    if (typeof recordOrId === 'string') {
      updateData = { id: recordOrId, ...changes };
    } else {
      const { id, ...rest } = recordOrId;
      updateData = { id, ...rest };
    }
    await firstValueFrom(this.http.put('/api/production', updateData));
    await this.loadRecords();
  }

  async deleteRecord(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/production?id=${id}`));
    await this.loadRecords();
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
}

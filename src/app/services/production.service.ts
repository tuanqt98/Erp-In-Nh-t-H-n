import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ProductionRecord } from '../models/production.model';

@Injectable({ providedIn: 'root' })
export class ProductionService {
  private http = inject(HttpClient);
  private _records$ = new BehaviorSubject<ProductionRecord[]>([]);
  private _totalRecords$ = new BehaviorSubject<number>(0);
  private _stages$ = new BehaviorSubject<string[]>([]);
  private _stats$ = new BehaviorSubject<{totalOK: number, totalLoi: number, todayCount: number}>({
    totalOK: 0, totalLoi: 0, todayCount: 0
  });

  get records$(): Observable<ProductionRecord[]> {
    return this._records$.asObservable();
  }

  get totalRecords$(): Observable<number> {
    return this._totalRecords$.asObservable();
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

  async refresh(page = 0, pageSize = 25, search = ''): Promise<void> {
    await Promise.all([this.loadRecords(page, pageSize, search), this.loadStages()]);
  }

  async loadRecords(page = 0, pageSize = 25, search = ''): Promise<void> {
    try {
      const url = `/api/production?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`;
      const res = await firstValueFrom(this.http.get<any>(url));
      
      const data = res.records || [];
      const total = res.total || 0;

      const records: ProductionRecord[] = data.map((r: any) => ({
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
        employeeId: r.employeeId,
      }));
      
      this._records$.next(records);
      this._totalRecords$.next(total);
      if (res.stats) {
        this._stats$.next(res.stats);
      }
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
    return this._stats$.getValue().totalOK;
  }

  getTotalLoi(): number {
    return this._stats$.getValue().totalLoi;
  }

  getTodayCount(): number {
    return this._stats$.getValue().todayCount;
  }
}

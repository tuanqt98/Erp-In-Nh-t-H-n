import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { OrderRecord } from '../models/order.model';
import * as XLSX from 'xlsx';

export interface OrderImportPreviewRow {
  data: Omit<OrderRecord, 'id'>;
  status: 'new' | 'duplicate';
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private _orders$ = new BehaviorSubject<OrderRecord[]>([]);
  private _totalOrders$ = new BehaviorSubject<number>(0);

  /** Full list of ALL orders (loaded once for LSX autocomplete/lookup) */
  private _allOrders: OrderRecord[] = [];
  get allOrders(): OrderRecord[] { return this._allOrders; }

  get orders$(): Observable<OrderRecord[]> {
    return this._orders$.asObservable();
  }

  get totalOrders$(): Observable<number> {
    return this._totalOrders$.asObservable();
  }

  get orders(): OrderRecord[] {
    return this._orders$.getValue();
  }

  constructor() {
    this.refresh();
    this.loadAllOrders(); // Load ALL orders for LSX lookup
  }

  /** Load ALL orders (no pagination) for autocomplete/lookup */
  async loadAllOrders(): Promise<void> {
    try {
      const url = `/api/orders?page=0&pageSize=99999&search=`;
      const res = await firstValueFrom(this.http.get<any>(url));
      this._allOrders = res.orders || [];
      console.log(`📦 Loaded ${this._allOrders.length} orders for LSX lookup`);
    } catch (err) {
      console.error('Failed to load all orders:', err);
    }
  }

  async refresh(page = 0, pageSize = 25, search = ''): Promise<void> {
    try {
      const url = `/api/orders?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`;
      const res = await firstValueFrom(this.http.get<any>(url));
      
      this._orders$.next(res.orders || []);
      this._totalOrders$.next(res.total || 0);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  }

  async importFromExcel(file: File): Promise<{ count: number; skipped: number }> {
    const rows = await this.parseExcel(file);
    const newOnes = rows.filter(r => r.status === 'new').map(r => r.data);
    const skipped = rows.length - newOnes.length;
    await this.appendRecords(newOnes);
    return { count: newOnes.length, skipped };
  }

  /** Robust Excel parser with multi-sheet scanning and positional fallback */
  parseExcel(file: File): Promise<OrderImportPreviewRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array', cellDates: true });
          
          let bestRaw: any[][] = [];
          let maxRows = 0;

          for (const sName of wb.SheetNames) {
            const ws = wb.Sheets[sName];
            const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            if (raw.length > maxRows) {
              maxRows = raw.length;
              bestRaw = raw;
            }
          }

          if (bestRaw.length < 1) { resolve([]); return; }

          const fields: (keyof Omit<OrderRecord, 'id'>)[] = [
            'lenhSanXuat', 'ngayGiao', 'productRaw' as any, 'soLuong', 'dvt'
          ];

          const norm = (s: any) => String(s ?? '').toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/\s+/g, ' ').trim();

          const fmtDate = (val: any): string => {
            if (!val && val !== 0) return '';
            if (val instanceof Date) {
              return `${String(val.getDate()).padStart(2,'0')}/${String(val.getMonth()+1).padStart(2,'0')}/${val.getFullYear()}`;
            }
            if (typeof val === 'number' && val > 40000 && val < 60000) {
              const d = new Date(Math.round((val - 25569) * 86400 * 1000));
              return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;
            }
            const s = String(val).trim();
            if (s.includes('GMT') || /^\d{4}-\d{2}-\d{2}/.test(s)) {
              const d = new Date(s);
              if (!isNaN(d.getTime())) {
                return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
              }
            }
            return s;
          };

          const patterns: Record<string, RegExp[]> = {
            lenhSanXuat:   [/^lsx$|^lenh.*sx|^ma.*lenh|^ma.*tham.*chieu|^internal.*ref/],
            ngayGiao:      [/ngay.*giao|ngay.*xuat|delivery|date.*planned/],
            productRaw:    [/^(?!.*don.*vi).*san.*pham|^product$/], // Exclude 'don vi' from product matching
            soLuong:       [/so.*luong|quantity|qty|^qty/],
            dvt:           [/^dvt$|don.*vi.*tinh|don.*vi|uom|unit/],
          };

          let headerRowIdx = -1;
          let bestScore = 0;
          for (let ri = 0; ri < Math.min(10, bestRaw.length); ri++) {
            const rowNorm = (bestRaw[ri] as any[]).map(c => norm(c));
            let score = 0;
            Object.values(patterns).forEach(rxList => {
                if (rowNorm.some(h => rxList.some(rx => rx.test(h)))) score++;
            });
            if (score > bestScore) { bestScore = score; headerRowIdx = ri; }
          }

          const colIdx: Record<string, number> = {};
          if (headerRowIdx >= 0 && bestScore >= 4) {
            const hRow = (bestRaw[headerRowIdx] as any[]).map(c => norm(c));
            Object.keys(patterns).forEach(field => {
              hRow.forEach((h, i) => {
                if (colIdx[field] === undefined && patterns[field].some(rx => rx.test(h))) colIdx[field] = i;
              });
            });
          } else {
            headerRowIdx = -1; 
            fields.forEach((f, i) => colIdx[f] = i);
          }

          const existingLSX = new Set(this.orders.map(o => o.lenhSanXuat?.trim()));
          const rows: OrderImportPreviewRow[] = [];
          for (let r = headerRowIdx + 1; r < bestRaw.length; r++) {
            const row = bestRaw[r];
            if (!row.some(c => c !== '' && c !== null && c !== undefined)) continue;

            // Skip rows that look like headers (contain "Sản phẩm" or "Lệnh SX")
            const firstCell = String(row[colIdx['lenhSanXuat']] || '').toLowerCase();
            if (firstCell.includes('ma tham chieu') || firstCell.includes('san pham') || firstCell.includes('lenh sx')) continue;

            const rowData: any = {
              ngayXuong: '',
              khachHang: '',
              nguyenVatLieu: '',
              rong: '',
              dai: '',
              kc: '',
              khoGiay: '',
              haoPhi: ''
            };

            // Map standard fields
            if (colIdx['lenhSanXuat'] !== undefined) rowData.lenhSanXuat = String(row[colIdx['lenhSanXuat']] ?? '').trim();
            if (colIdx['ngayGiao'] !== undefined) rowData.ngayGiao = fmtDate(row[colIdx['ngayGiao']]);
            if (colIdx['soLuong'] !== undefined) rowData.soLuong = Number(row[colIdx['soLuong']]) || 0;
            if (colIdx['dvt'] !== undefined) rowData.dvt = String(row[colIdx['dvt']] ?? '').trim();

            // Handle Product column: Store entire string in both fields for simple management
            let prodStr = '';
            if (colIdx['productRaw'] !== undefined) {
              prodStr = String(row[colIdx['productRaw']] ?? '').trim();
            } else if (headerRowIdx === -1 && row[2]) {
              // Positional fallback for column C if no header found
              prodStr = String(row[2] ?? '').trim();
            }

            rowData.maHang = prodStr;
            rowData.tenHang = prodStr;

            // Final safety check for LSX
            if (!rowData.lenhSanXuat || rowData.lenhSanXuat === '0' || rowData.lenhSanXuat.toLowerCase() === 'confirmed') continue;

            rows.push({
              status: existingLSX.has(rowData.lenhSanXuat) ? 'duplicate' : 'new',
              data: rowData as Omit<OrderRecord, 'id'>
            });
          }
          resolve(rows);
        } catch (err) { reject(err); }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  async appendRecords(rows: Omit<OrderRecord, 'id'>[]): Promise<void> {
    if (rows.length === 0) return;
    await firstValueFrom(
      this.http.post('/api/orders', { action: 'batch', items: rows })
    );
    await this.refresh();
  }

  async clearAll(): Promise<void> {
    await firstValueFrom(
      this.http.post('/api/orders', { action: 'clearAll' })
    );
    this._orders$.next([]);
  }

  async addOrder(record: Omit<OrderRecord, 'id'>): Promise<void> {
    await firstValueFrom(this.http.post('/api/orders', record));
    await this.refresh();
  }

  async deleteOrder(index: number): Promise<void> {
    const order = this.orders[index];
    if (order?.id) {
      await firstValueFrom(this.http.delete(`/api/orders?id=${order.id}`));
      await this.refresh();
    }
  }

  /**
   * Search orders by lenhSanXuat via API (not limited to current page).
   * Returns the first matching order or null.
   */
  async findByLSX(lsx: string): Promise<OrderRecord | null> {
    if (!lsx || !lsx.trim()) return null;
    try {
      const url = `/api/orders?page=0&pageSize=50&search=${encodeURIComponent(lsx.trim())}`;
      const res = await firstValueFrom(this.http.get<any>(url));
      const orders: OrderRecord[] = res.orders || [];
      // Try exact match first
      const exact = orders.find(o => o.lenhSanXuat?.trim().toLowerCase() === lsx.trim().toLowerCase());
      if (exact) return exact;
      // Fallback: find order whose LSX contains the search value or vice versa
      const partial = orders.find(o =>
        o.lenhSanXuat?.trim().toLowerCase().includes(lsx.trim().toLowerCase()) ||
        lsx.trim().toLowerCase().includes(o.lenhSanXuat?.trim().toLowerCase())
      );
      return partial || null;
    } catch (err) {
      console.error('findByLSX error:', err);
      return null;
    }
  }

  /**
   * Get LSX options for autocomplete by searching the API.
   * Returns unique lenhSanXuat values matching the query.
   */
  async searchLSXOptions(query: string): Promise<string[]> {
    if (!query || !query.trim()) {
      // Return LSX from current local orders if no query
      return [...new Set(this.orders.map(o => o.lenhSanXuat))];
    }
    try {
      const url = `/api/orders?page=0&pageSize=50&search=${encodeURIComponent(query.trim())}`;
      const res = await firstValueFrom(this.http.get<any>(url));
      const orders: OrderRecord[] = res.orders || [];
      return [...new Set(orders.map(o => o.lenhSanXuat))];
    } catch (err) {
      console.error('searchLSXOptions error:', err);
      return [];
    }
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { OrderRecord } from '../models/order.model';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'order_records';

export interface OrderImportPreviewRow {
  data: Omit<OrderRecord, 'id'>;
  status: 'new' | 'duplicate';
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private _orders$ = new BehaviorSubject<OrderRecord[]>([]);

  get orders$(): Observable<OrderRecord[]> {
    return this._orders$.asObservable();
  }

  get orders(): OrderRecord[] {
    return this._orders$.getValue();
  }

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this._orders$.next(JSON.parse(saved));
      } catch {
        this._orders$.next([]);
      }
    }
  }

  private saveToStorage(records: OrderRecord[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    this._orders$.next(records);
  }

  importFromExcel(file: File): Promise<{ count: number; skipped: number }> {
    return new Promise((resolve, reject) => {
      this.parseExcel(file).then(rows => {
        const newOnes = rows.filter(r => r.status === 'new').map(r => r.data);
        const skipped = rows.length - newOnes.length;
        this.appendRecords(newOnes);
        resolve({ count: newOnes.length, skipped });
      }).catch(reject);
    });
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

          // Find sheet with most data
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
            'lenhSanXuat', 'ngayXuong', 'ngayGiao', 'maHang', 'khachHang',
            'tenHang', 'dvt', 'nguyenVatLieu', 'rong', 'dai', 'kc',
            'soLuong', 'khoGiay', 'haoPhi'
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
            lenhSanXuat:   [/^lsx$|^lenh.*sx|^ma.*lenh/],
            ngayXuong:     [/ngay.*xuong|ngay.*vao|date.*in/],
            ngayGiao:      [/ngay.*giao|ngay.*xuat|delivery/],
            maHang:        [/ma.*hang|item.*code|product.*code/],
            khachHang:     [/khach.*hang|customer/],
            tenHang:       [/ten.*hang|ten.*sp|product.*name/],
            dvt:           [/^dvt$|don.*vi.*tinh/],
            nguyenVatLieu: [/nguyen.*vat.*lieu|nvl|material/],
            rong:          [/^rong$|^width/],
            dai:           [/^dai$|^length/],
            kc:            [/^kc[\s(]|pitch/],
            soLuong:       [/so.*luong|quantity|qty/],
            khoGiay:       [/kho.*giay|paper.*size/],
            haoPhi:        [/hao.*phi|waste/],
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

          const existingCodes = new Set(this.orders.map(o => o.maHang?.trim()));
          const rows: OrderImportPreviewRow[] = [];
          for (let r = headerRowIdx + 1; r < bestRaw.length; r++) {
            const row = bestRaw[r];
            if (!row.some(c => c !== '' && c !== null && c !== undefined)) continue;

            const rowData: any = {};
            fields.forEach(f => {
              const i = colIdx[f];
              let val = (i !== undefined && i < row.length) ? row[i] : '';
              if (f === 'ngayXuong' || f === 'ngayGiao') {
                rowData[f] = fmtDate(val);
              } else if (f === 'soLuong') {
                rowData[f] = Number(val) || 0;
              } else {
                rowData[f] = String(val ?? '').trim();
              }
            });

            if (!rowData.lenhSanXuat && !rowData.tenHang) continue;

            rows.push({
              status: (rowData.maHang && existingCodes.has(rowData.maHang)) ? 'duplicate' : 'new',
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

  appendRecords(rows: Omit<OrderRecord, 'id'>[]): void {
    const newRecords: OrderRecord[] = rows.map(r => ({ ...r, id: crypto.randomUUID() }));
    this.saveToStorage([...this.orders, ...newRecords]);
  }

  clearAll(): void {
    this.saveToStorage([]);
  }

  addOrder(record: Omit<OrderRecord, 'id'>): void {
    const newRec: OrderRecord = { ...record, id: crypto.randomUUID() };
    this.saveToStorage([newRec, ...this.orders]);
  }

  deleteOrder(index: number): void {
    const current = [...this.orders];
    current.splice(index, 1);
    this.saveToStorage(current);
  }

  refresh(): void {
    this.loadFromStorage();
  }
}

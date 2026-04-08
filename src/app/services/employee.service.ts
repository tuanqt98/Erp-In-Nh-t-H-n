import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Employee } from '../models/employee.model';

export type EmployeeRole = 'admin' | 'manager' | 'staff';

export interface EmployeeAccount {
  username: string;
  password: string;
  employeeId: string;
  role: EmployeeRole;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private _employees$ = new BehaviorSubject<Employee[]>([]);

  employees$ = this._employees$.asObservable();

  get employees(): Employee[] {
    return this._employees$.getValue();
  }

  constructor() {
    this.refresh();
  }

  // ─── API Calls ─────────────────────────────────────────────────────────────────

  async refresh(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<any[]>('/api/employees'));
      const employees: Employee[] = (data || []).map(e => ({
        id: e.id,
        maNhanVien: e.maNhanVien,
        tenNhanVien: e.tenNhanVien,
        phongBan: e.phongBan,
        chucVu: e.chucVu,
        email: e.email || undefined,
        soDienThoai: e.soDienThoai || undefined,
        ngayVaoLam: e.ngayVaoLam || undefined,
        trangThai: e.trangThai as 'active' | 'inactive',
        createdAt: e.createdAt,
      }));
      this._employees$.next(employees);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  }

  // ─── Employee Code Generator ──────────────────────────────────────────────────

  generateMaNV(): string {
    const maxNum = this.employees.reduce((max, e) => {
      const match = e.maNhanVien.match(/(\d+)$/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return `NV${String(maxNum + 1).padStart(3, '0')}`;
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async add(partial: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> {
    const emp = await firstValueFrom(this.http.post<Employee>('/api/employees', partial));
    await this.refresh();
    return emp;
  }

  async addBatch(items: Omit<Employee, 'id' | 'createdAt'>[]): Promise<Employee[]> {
    const result = await firstValueFrom(
      this.http.post<{ count: number; employees: Employee[] }>('/api/employees', { action: 'batch', items })
    );
    await this.refresh();
    return result.employees;
  }

  async update(id: string, changes: Partial<Employee>): Promise<void> {
    await firstValueFrom(this.http.put('/api/employees', { id, ...changes }));
    await this.refresh();
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/employees?id=${id}`));
    await this.refresh();
  }

  // ─── Role Management ──────────────────────────────────────────────────────────

  async setRole(employeeId: string, role: EmployeeRole): Promise<void> {
    await firstValueFrom(
      this.http.post('/api/employees', { action: 'setRole', employeeId, role })
    );
  }

  getRole(employeeId: string): EmployeeRole {
    const emp = this.employees.find(e => e.id === employeeId) as any;
    return emp?.user?.role ?? 'staff';
  }

  // ─── Password ─────────────────────────────────────────────────────────────────

  async resetPassword(employeeId: string): Promise<void> {
    await firstValueFrom(
      this.http.post('/api/employees', { action: 'resetPassword', employeeId })
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  isDuplicateCode(maNhanVien: string, excludeId?: string): boolean {
    return this.employees.some(e => e.maNhanVien === maNhanVien && e.id !== excludeId);
  }
}

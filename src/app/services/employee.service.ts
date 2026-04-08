import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Employee } from '../models/employee.model';

const STORAGE_KEY = 'employees_data';
const ACCOUNTS_KEY = 'employee_accounts';

export type EmployeeRole = 'admin' | 'manager' | 'staff';

export interface EmployeeAccount {
  username: string;    // maNhanVien
  password: string;    // default "1"
  employeeId: string;
  role: EmployeeRole;  // default "staff"
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private _employees$ = new BehaviorSubject<Employee[]>(this.load());

  employees$ = this._employees$.asObservable();

  get employees(): Employee[] {
    return this._employees$.getValue();
  }

  // ─── Private Storage Helpers ─────────────────────────────────────────────────

  private load(): Employee[] {
    const data = localStorage.getItem(STORAGE_KEY);
    const employees: Employee[] = data ? JSON.parse(data) : [];
    return this.deduplicateIds(employees);
  }

  /** Fix duplicate IDs caused by the old Date.now() bug in batch imports */
  private deduplicateIds(employees: Employee[]): Employee[] {
    const seenIds = new Set<string>();
    let changed = false;
    const fixed = employees.map(e => {
      if (seenIds.has(e.id)) {
        changed = true;
        const newId = this.generateFreshId();
        // Update account reference
        const accounts = this.rawLoadAccounts();
        const updatedAccounts = accounts.map(a =>
          a.employeeId === e.id ? { ...a, employeeId: newId } : a
        );
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
        return { ...e, id: newId };
      }
      seenIds.add(e.id);
      return e;
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fixed));
    }
    return fixed;
  }

  private generateFreshId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private rawLoadAccounts(): any[] {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private save(employees: Employee[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    this._employees$.next(employees);
  }

  // ─── Public Account Helpers ───────────────────────────────────────────────────

  loadAccounts(): EmployeeAccount[] {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    const raw: any[] = data ? JSON.parse(data) : [];
    // Migrate: ensure every account has a role field
    return raw.map(a => ({ role: 'staff' as EmployeeRole, ...a }));
  }

  saveAccounts(accounts: EmployeeAccount[]): void {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
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

  private uniqueId(): string {
    return this.generateFreshId();
  }

  add(partial: Omit<Employee, 'id' | 'createdAt'>): Employee {
    const newEmp: Employee = {
      ...partial,
      id: this.uniqueId(),
      createdAt: new Date().toISOString(),
    };
    this.save([...this.employees, newEmp]);
    this.createAccount(newEmp.maNhanVien, newEmp.id, 'staff');
    return newEmp;
  }

  /** Batch add — more efficient for imports, single save() call */
  addBatch(items: Omit<Employee, 'id' | 'createdAt'>[]): Employee[] {
    const newEmps: Employee[] = items.map(partial => ({
      ...partial,
      id: this.uniqueId(),
      createdAt: new Date().toISOString(),
    }));
    this.save([...this.employees, ...newEmps]);
    newEmps.forEach(e => this.createAccount(e.maNhanVien, e.id, 'staff'));
    return newEmps;
  }

  update(id: string, changes: Partial<Employee>): void {
    const updated = this.employees.map(e => e.id === id ? { ...e, ...changes } : e);
    this.save(updated);
    if (changes.maNhanVien) {
      const accounts = this.loadAccounts().map(a =>
        a.employeeId === id ? { ...a, username: changes.maNhanVien! } : a
      );
      this.saveAccounts(accounts);
    }
  }

  delete(id: string): void {
    this.save(this.employees.filter(e => e.id !== id));
    const accounts = this.loadAccounts().filter(a => a.employeeId !== id);
    this.saveAccounts(accounts);
  }

  // ─── Role Management ──────────────────────────────────────────────────────────

  setRole(employeeId: string, role: EmployeeRole): void {
    const accounts = this.loadAccounts().map(a =>
      a.employeeId === employeeId ? { ...a, role } : a
    );
    this.saveAccounts(accounts);
  }

  getRole(employeeId: string): EmployeeRole {
    const acc = this.loadAccounts().find(a => a.employeeId === employeeId);
    return acc?.role ?? 'staff';
  }

  // ─── Password ─────────────────────────────────────────────────────────────────

  resetPassword(employeeId: string): void {
    const accounts = this.loadAccounts().map(a =>
      a.employeeId === employeeId ? { ...a, password: '1' } : a
    );
    this.saveAccounts(accounts);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private createAccount(maNhanVien: string, employeeId: string, role: EmployeeRole = 'staff'): void {
    const accounts = this.loadAccounts();
    if (!accounts.find(a => a.username === maNhanVien)) {
      accounts.push({ username: maNhanVien, password: '1', employeeId, role });
      this.saveAccounts(accounts);
    }
  }

  isDuplicateCode(maNhanVien: string, excludeId?: string): boolean {
    return this.employees.some(e => e.maNhanVien === maNhanVien && e.id !== excludeId);
  }

  refresh(): void {
    this._employees$.next(this.load());
  }
}

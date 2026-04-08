import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  username: string;
  role: 'admin' | 'staff' | 'manager';
  displayName: string;
  employeeId?: string;  // Set when logged in as employee
}

const AUTH_KEY = 'auth_session';
const EMPLOYEE_ACCOUNTS_KEY = 'employee_accounts';

const BUILT_IN_ACCOUNTS: { username: string; password: string; user: User }[] = [
  { username: 'admin',   password: '1',          user: { username: 'admin',   role: 'admin',   displayName: 'Quản Trị Viên' } },
  { username: 'qlsx',    password: '1',          user: { username: 'qlsx',    role: 'manager', displayName: 'Quản Lý Sản Xuất' } },
  { username: 'staff',   password: '1',          user: { username: 'staff',   role: 'staff',   displayName: 'Nhân Viên In' } },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private _currentUser$ = new BehaviorSubject<User | null>(null);

  get currentUser$(): Observable<User | null> {
    return this._currentUser$.asObservable();
  }

  get currentUser(): User | null {
    return this._currentUser$.getValue();
  }

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    const session = localStorage.getItem(AUTH_KEY);
    if (session && session !== 'undefined') {
      try {
        this._currentUser$.next(JSON.parse(session));
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }

  login(username: string, password: string): boolean {
    // 1. Check built-in accounts
    const builtIn = BUILT_IN_ACCOUNTS.find(a => a.username === username && a.password === password);
    if (builtIn) {
      const savedName = localStorage.getItem(`displayName_${username}`);
      const user: User = { ...builtIn.user, displayName: savedName ?? builtIn.user.displayName };
      this._doLogin(user);
      return true;
    }

    // 2. Check employee accounts (stored in localStorage by EmployeeService)
    const empAccounts: { username: string; password: string; employeeId: string; role?: string }[] =
      JSON.parse(localStorage.getItem(EMPLOYEE_ACCOUNTS_KEY) ?? '[]');
    const empAccount = empAccounts.find(a => a.username === username && a.password === password);

    if (empAccount) {
      // Get employee details
      const employees: any[] = JSON.parse(localStorage.getItem('employees_data') ?? '[]');
      const emp = employees.find((e: any) => e.id === empAccount.employeeId && e.trangThai === 'active');
      if (emp) {
        const savedName = localStorage.getItem(`displayName_${username}`);
        const user: User = {
          username: emp.maNhanVien,
          role: (empAccount.role ?? 'staff') as 'admin' | 'manager' | 'staff',
          displayName: savedName ?? emp.tenNhanVien,
          employeeId: emp.id
        };
        this._doLogin(user);
        return true;
      }
    }

    return false;
  }

  private _doLogin(user: User): void {
    this._currentUser$.next(user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this._currentUser$.next(null);
    localStorage.removeItem(AUTH_KEY);
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  isManager(): boolean {
    const role = this.currentUser?.role;
    return role === 'manager' || role === 'admin';
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  getToken(): string | null {
    const session = localStorage.getItem(AUTH_KEY);
    return session ? 'dummy-session-token' : null;
  }
}

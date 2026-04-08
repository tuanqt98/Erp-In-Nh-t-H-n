import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

export interface User {
  username: string;
  role: 'admin' | 'staff' | 'manager';
  displayName: string;
  employeeId?: string;
}

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
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
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    if (!token || !userJson || userJson === 'undefined' || userJson === 'null') {
      this.clearStorage();
      return;
    }
    try {
      this._currentUser$.next(JSON.parse(userJson));
    } catch {
      this.clearStorage();
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const response: any = await firstValueFrom(
        this.http.post('/api/auth', { username, password })
      );
      if (response?.token && response?.user) {
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        this._currentUser$.next(response.user as User);
        this.router.navigate(['/dashboard']);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  logout(): void {
    this._currentUser$.next(null);
    this.clearStorage();
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
    return localStorage.getItem(TOKEN_KEY);
  }

  async changePassword(username: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post('/api/auth', { action: 'changePassword', username, password: currentPassword, newPassword })
      );
      return true;
    } catch {
      return false;
    }
  }

  async changeDisplayName(username: string, newDisplayName: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post('/api/auth', { action: 'changeDisplayName', username, newDisplayName })
      );
      // Update local copy
      const user = this.currentUser;
      if (user) {
        user.displayName = newDisplayName;
        this._currentUser$.next({ ...user });
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      return true;
    } catch {
      return false;
    }
  }
}

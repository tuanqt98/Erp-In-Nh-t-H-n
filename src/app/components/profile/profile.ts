import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule
  ],
  template: `
    <div class="profile-page">
      <div class="profile-hero">
        <!-- Avatar -->
        <div class="avatar-section">
          <div class="avatar-wrapper" (click)="fileInput.click()">
            <img *ngIf="avatarUrl" [src]="avatarUrl" class="avatar-img" alt="Avatar">
            <div *ngIf="!avatarUrl" class="avatar-placeholder">
              <span>{{ initials }}</span>
            </div>
            <div class="avatar-overlay">
              <mat-icon>camera_alt</mat-icon>
              <span>Đổi ảnh</span>
            </div>
          </div>
          <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileChange($event)">
          <p class="avatar-hint">Nhấn vào ảnh để thay đổi</p>
        </div>

        <!-- Info -->
        <div class="profile-info glass-panel">
          <h2 class="section-title">
            <mat-icon>manage_accounts</mat-icon>
            Thông Tin Tài Khoản
          </h2>

          <div class="info-group">
            <label class="info-label">Tên đăng nhập</label>
            <div class="info-value readonly">{{ user?.username }}</div>
          </div>

          <div class="info-group">
            <label class="info-label">Vai trò</label>
            <div class="info-value">
              <span class="role-badge" [ngClass]="'role-' + user?.role">
                <mat-icon>{{ getRoleIcon() }}</mat-icon>
                {{ getRoleLabel() }}
              </span>
            </div>
          </div>

          <div class="info-group">
            <label class="info-label">Tên hiển thị</label>
            <mat-form-field appearance="outline" class="edit-field">
              <input matInput [(ngModel)]="displayName" placeholder="Nhập tên hiển thị...">
              <mat-icon matSuffix class="neon-icon">edit</mat-icon>
            </mat-form-field>
          </div>

          <div class="action-row">
            <button mat-raised-button class="btn-save" (click)="saveProfile()">
              <mat-icon>save</mat-icon>
              Lưu Thay Đổi
            </button>
            <button mat-button class="btn-logout" (click)="logout()">
              <mat-icon>logout</mat-icon>
              Đăng Xuất
            </button>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="profile-stats glass-panel">
        <h3 class="section-title"><mat-icon>bar_chart</mat-icon> Thống kê tài khoản</h3>
        <div class="stats-row">
          <div class="stat-item">
            <mat-icon>badge</mat-icon>
            <div>
              <div class="stat-val">{{ user?.username }}</div>
              <div class="stat-lbl">Tài khoản</div>
            </div>
          </div>
          <div class="stat-item">
            <mat-icon>schedule</mat-icon>
            <div>
              <div class="stat-val">{{ loginTime }}</div>
              <div class="stat-lbl">Đăng nhập lúc</div>
            </div>
          </div>
          <div class="stat-item">
            <mat-icon>verified_user</mat-icon>
            <div>
              <div class="stat-val neon-text">{{ getRoleLabel() }}</div>
              <div class="stat-lbl">Quyền hạn</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 900px;
      margin: 0 auto;
    }
    .profile-hero {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 24px;
    }
    @media (max-width: 700px) {
      .profile-hero { grid-template-columns: 1fr; }
    }

    /* Avatar */
    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .avatar-wrapper {
      position: relative;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      cursor: pointer;
      overflow: hidden;
      border: 3px solid var(--ag-neon);
      box-shadow: 0 0 25px var(--ag-neon-glow);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .avatar-wrapper:hover { transform: scale(1.03); box-shadow: 0 0 40px var(--ag-neon-glow); }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--ag-neon) 0%, #0369a1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      font-weight: 800;
      color: white;
    }
    .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      opacity: 0;
      transition: opacity 0.3s;
      color: white;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .avatar-overlay mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .avatar-wrapper:hover .avatar-overlay { opacity: 1; }
    .avatar-hint { font-size: 0.8rem; color: var(--ag-text-secondary); text-align: center; }

    /* Info panel */
    .profile-info {
      padding: 28px;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 1.2rem;
      color: var(--ag-text-primary);
      margin: 0 0 24px 0;
    }
    .section-title mat-icon { color: var(--ag-neon); }
    .info-group {
      margin-bottom: 20px;
    }
    .info-label {
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--ag-text-secondary);
      margin-bottom: 6px;
      font-weight: 600;
    }
    .info-value.readonly {
      font-size: 1rem;
      color: var(--ag-text-primary);
      padding: 8px 12px;
      background: var(--ag-border);
      border-radius: 8px;
      border: 1px solid var(--ag-border);
    }
    .edit-field { width: 100%; }
    .neon-icon { color: var(--ag-neon) !important; }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .role-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .role-admin { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .role-manager { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .role-staff { background: rgba(14,165,233,0.15); color: var(--ag-neon); border: 1px solid rgba(14,165,233,0.3); }

    .action-row {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }
    .btn-save {
      background: linear-gradient(135deg, var(--ag-neon) 0%, #0369a1 100%) !important;
      color: white !important;
      font-weight: 600 !important;
    }
    .btn-save:hover { box-shadow: 0 0 15px var(--ag-neon-glow) !important; }
    .btn-logout { color: #ef4444 !important; }

    /* Stats */
    .profile-stats {
      padding: 28px;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }
    .stat-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      background: var(--ag-neon-glow);
      border-radius: 12px;
      border: 1px solid var(--ag-border);
    }
    .stat-item mat-icon { color: var(--ag-neon); font-size: 28px; width: 28px; height: 28px; }
    .stat-val { font-weight: 700; font-size: 1rem; color: var(--ag-text-primary); }
    .stat-lbl { font-size: 0.75rem; color: var(--ag-text-secondary); text-transform: uppercase; }
    .neon-text { color: var(--ag-neon) !important; }
  `]
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  user = this.authService.currentUser;
  displayName = this.user?.displayName ?? '';
  avatarUrl: string | null = null;
  loginTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  get initials(): string {
    return this.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  ngOnInit(): void {
    // Load avatar from localStorage
    const saved = localStorage.getItem(`avatar_${this.user?.username}`);
    if (saved) this.avatarUrl = saved;

    const savedName = localStorage.getItem(`displayName_${this.user?.username}`);
    if (savedName) this.displayName = savedName;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarUrl = e.target?.result as string;
      localStorage.setItem(`avatar_${this.user?.username}`, this.avatarUrl);
      this.snackBar.open('✅ Đã cập nhật ảnh đại diện!', 'Đóng', { duration: 2000 });
    };
    reader.readAsDataURL(file);
  }

  async saveProfile(): Promise<void> {
    if (!this.displayName.trim()) return;
    if (this.user?.username) {
      const ok = await this.authService.changeDisplayName(this.user.username, this.displayName);
      if (ok) {
        this.snackBar.open('✅ Đã lưu thông tin!', 'Đóng', { duration: 2000 });
      } else {
        this.snackBar.open('❌ Không thể lưu. Thử lại sau.', 'Đóng', { duration: 3000 });
      }
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getRoleLabel(): string {
    const labels: Record<string, string> = { admin: 'Quản Trị Viên', manager: 'Quản Lý SX', staff: 'Nhân Viên' };
    return labels[this.user?.role ?? ''] ?? 'Không xác định';
  }

  getRoleIcon(): string {
    const icons: Record<string, string> = { admin: 'admin_panel_settings', manager: 'supervisor_account', staff: 'person' };
    return icons[this.user?.role ?? ''] ?? 'person';
  }
}

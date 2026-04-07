import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card mat-elevation-z8">
        <mat-card-header>
          <div mat-card-avatar class="login-icon">
            <mat-icon>lock</mat-icon>
          </div>
          <mat-card-title>Đăng Nhập Hệ Thống</mat-card-title>
          <mat-card-subtitle>Quản lý sản lượng thợ in</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <mat-form-field appearance="outline">
              <mat-label>Tên đăng nhập</mat-label>
              <input matInput formControlName="username" placeholder="admin hoặc staff">
              <mat-icon matSuffix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Mật khẩu</mat-label>
              <input matInput [type]="hide ? 'password' : 'text'" formControlName="password">
              <button mat-icon-button matSuffix (click)="hide = !hide" [attr.aria-label]="'Hide password'" [attr.aria-pressed]="hide" type="button">
                <mat-icon>{{hide ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
            </mat-form-field>

            <div class="hint">
              <p>Thử: admin / admin123 (Admin)</p>
              <p>Thử: staff / staff123 (Công nhân)</p>
            </div>

            <button mat-raised-button color="primary" type="submit" [disabled]="loginForm.invalid" class="login-button">
              Đăng Nhập
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 40px 32px;
      border-radius: 24px !important;
      background: var(--ag-glass) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      border: 1px solid var(--ag-border) !important;
      box-shadow: var(--ag-shadow) !important;
    }
    :host ::ng-deep .mat-mdc-card-header {
      justify-content: center;
      margin-bottom: 8px;
    }
    :host ::ng-deep .mat-mdc-card-title {
      color: var(--ag-text-primary) !important;
      font-weight: 800 !important;
      font-size: 1.4rem !important;
    }
    :host ::ng-deep .mat-mdc-card-subtitle {
      color: var(--ag-text-secondary) !important;
    }
    .login-icon {
      background: linear-gradient(135deg, var(--ag-neon) 0%, #0369a1 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      width: 48px !important;
      height: 48px !important;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 24px;
    }
    .login-button {
      padding: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      background: linear-gradient(135deg, var(--ag-neon) 0%, #0369a1 100%) !important;
      color: white !important;
      border-radius: 12px !important;
      letter-spacing: 0.5px;
    }
    .login-button:hover {
      box-shadow: 0 0 20px var(--ag-neon-glow) !important;
    }
    .hint {
      font-size: 0.8rem;
      color: var(--ag-text-secondary);
      text-align: center;
    }
    .hint p { margin: 4px 0; }
    :host ::ng-deep .mat-mdc-form-field .mdc-text-field--outlined .mdc-notched-outline__leading,
    :host ::ng-deep .mat-mdc-form-field .mdc-text-field--outlined .mdc-notched-outline__notch,
    :host ::ng-deep .mat-mdc-form-field .mdc-text-field--outlined .mdc-notched-outline__trailing {
      border-color: var(--ag-border) !important;
    }
    :host ::ng-deep .mat-mdc-form-field:hover .mdc-text-field--outlined .mdc-notched-outline__leading,
    :host ::ng-deep .mat-mdc-form-field:hover .mdc-text-field--outlined .mdc-notched-outline__notch,
    :host ::ng-deep .mat-mdc-form-field:hover .mdc-text-field--outlined .mdc-notched-outline__trailing {
      border-color: var(--ag-neon) !important;
    }
    :host ::ng-deep .mat-mdc-input-element {
      color: var(--ag-text-primary) !important;
    }
    :host ::ng-deep .mat-mdc-form-field-label, :host ::ng-deep .mdc-floating-label {
      color: var(--ag-text-secondary) !important;
    }
    :host ::ng-deep .mat-mdc-icon-button {
      color: var(--ag-neon) !important;
    }
    @media (max-width: 480px) {
      .login-container { padding: 16px; height: auto; min-min-height: 100vh; }
      .login-card { padding: 32px 20px; border-radius: 16px !important; }
      :host ::ng-deep .mat-mdc-card-title { font-size: 1.2rem !important; }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loginForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  hide = true;

  onSubmit() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      const success = this.authService.login(username, password);

      if (!success) {
        this.snackBar.open('Tên đăng nhập hoặc mật khẩu không đúng!', 'Đóng', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    }
  }
}

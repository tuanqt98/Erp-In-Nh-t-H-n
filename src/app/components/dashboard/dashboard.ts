import { Component, inject, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { ProductionFormComponent } from '../production-form/production-form';
import { ProductionTableComponent } from '../production-table/production-table';
import { OrderTableComponent } from '../order-table/order-table';
import { SupportTimeComponent } from '../support-time/support-time';
import { ProfileComponent } from '../profile/profile';
import { EmployeeManagementComponent } from '../employee-management/employee-management';
import { ProductionService } from '../../services/production.service';
import { AuthService } from '../../services/auth.service';
import { SupportTimeService } from '../../services/support-time.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTooltipModule,
    MatBadgeModule,
    ProductionFormComponent,
    ProductionTableComponent,
    OrderTableComponent,
    SupportTimeComponent,
    ProfileComponent,
    EmployeeManagementComponent
  ],
  template: `
    <div class="dashboard-layout">
      <mat-toolbar class="header glass-panel">
        <!-- Mobile hamburger -->
        <button mat-icon-button class="mobile-menu-btn" (click)="mobileMenuOpen = !mobileMenuOpen">
          <mat-icon>{{ mobileMenuOpen ? 'close' : 'menu' }}</mat-icon>
        </button>

        <img src="https://innhathan.com/wp-content/uploads/2023/04/cropped-Logo-NH.gif" alt="Logo" class="app-logo">
        <span class="app-title">Công Ty TNHH In Nhật Hàn</span>
        <span class="spacer"></span>
        <!-- Notification Bell (Manager/Admin) -->
        <button mat-icon-button matTooltip="Thông báo phê duyệt"
                class="neon-icon"
                [matBadge]="notifCount > 0 ? notifCount : null"
                matBadgeColor="warn"
                (click)="activeTab = 2">
          <mat-icon>notifications</mat-icon>
        </button>
        <div class="user-profile" (click)="showProfile = !showProfile" style="cursor:pointer" *ngIf="authService.currentUser$ | async as user">
          <img *ngIf="getUserAvatar(user.username)" [src]="getUserAvatar(user.username)" alt="Avatar" class="avatar-img">
          <div *ngIf="!getUserAvatar(user.username)" class="avatar-initials">{{ getInitials(user.displayName) }}</div>
          <span class="neon-text">{{ user.displayName }}</span>
        </div>
        <button mat-icon-button (click)="toggleTheme()" matTooltip="Chuyển chế độ Sáng/Tối" class="neon-icon ml-2 desktop-only">
          <mat-icon>{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
        <button mat-icon-button (click)="authService.logout()" matTooltip="Đăng xuất" class="neon-icon desktop-only">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <!-- Mobile Menu Overlay -->
      <div class="mobile-menu-backdrop" *ngIf="mobileMenuOpen" (click)="mobileMenuOpen = false"></div>
      <div class="mobile-menu" [class.open]="mobileMenuOpen">
        <div class="mobile-menu-header">
          <img src="https://innhathan.com/wp-content/uploads/2023/04/cropped-Logo-NH.gif" alt="Logo" class="mobile-menu-logo">
          <span>In Nhật Hàn</span>
        </div>
        <nav class="mobile-nav">
          <button (click)="activeTab = 0; mobileMenuOpen = false" [class.active]="activeTab === 0">
            <mat-icon>analytics</mat-icon>
            <span>Quản Lý Sản Lượng</span>
          </button>
          <button (click)="activeTab = 1; mobileMenuOpen = false" [class.active]="activeTab === 1">
            <mat-icon>inventory_2</mat-icon>
            <span>Dữ Liệu Đơn Hàng</span>
          </button>
          <button (click)="activeTab = 2; mobileMenuOpen = false" [class.active]="activeTab === 2">
            <mat-icon>schedule</mat-icon>
            <span>Đăng Ký Hỗ Trợ</span>
            <span class="mobile-notif" *ngIf="notifCount > 0">{{ notifCount }}</span>
          </button>
          <button (click)="showProfile = true; activeTab = 3; mobileMenuOpen = false">
            <mat-icon>manage_accounts</mat-icon>
            <span>Trang Cá Nhân</span>
          </button>
          <button *ngIf="isAdmin()" (click)="activeTab = 4; mobileMenuOpen = false" [class.active]="activeTab === 4">
            <mat-icon>people</mat-icon>
            <span>Quản Lý Nhân Sự</span>
          </button>
        </nav>
        <div class="mobile-menu-footer">
          <button (click)="toggleTheme(); mobileMenuOpen = false">
            <mat-icon>{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
            <span>{{ isDarkMode ? 'Chế độ Sáng' : 'Chế độ Tối' }}</span>
          </button>
          <button class="logout-btn" (click)="authService.logout()">
            <mat-icon>logout</mat-icon>
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>

      <main class="content">
        <!-- Stats Row -->
        <div class="stats-grid">
          <div class="stat-card glass-panel blue">
            <div class="stat-icon"><mat-icon>check_circle</mat-icon></div>
            <div class="stat-info">
              <span class="label">Tổng Sản Lượng OK</span>
              <span class="value">{{ prodService.getTotalOK() | number }}</span>
            </div>
          </div>
          
          <div class="stat-card glass-panel red">
            <div class="stat-icon"><mat-icon>report_problem</mat-icon></div>
            <div class="stat-info">
              <span class="label">Tổng Sản Lượng Lỗi</span>
              <span class="value">{{ prodService.getTotalLoi() | number }}</span>
            </div>
          </div>
 
          <div class="stat-card glass-panel purple">
            <div class="stat-icon"><mat-icon>person</mat-icon></div>
            <div class="stat-info">
              <span class="label">Nhân Viên Ghi Nhận</span>
              <span class="value">{{ prodService.getTodayCount() }} hôm nay</span>
            </div>
          </div>
 
          <div class="stat-card glass-panel orange">
            <div class="stat-icon"><mat-icon>trending_up</mat-icon></div>
            <div class="stat-info">
              <span class="label">Hiệu Suất</span>
              <span class="value">{{ getYield() | percent:'1.1-1' }}</span>
            </div>
          </div>
        </div>
 
        <!-- Tabs Section -->
        <mat-tab-group color="primary" class="dashboard-tabs glass-panel" [(selectedIndex)]="activeTab">
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="mr-2 neon-icon">analytics</mat-icon>
              <span class="neon-text tab-label">Quản Lý Sản Lượng</span>
            </ng-template>
            <div class="tab-content">
               <div class="main-sections">
                <section class="section-form">
                  <app-production-form></app-production-form>
                </section>
 
                <section class="section-table">
                  <app-production-table></app-production-table>
                </section>
              </div>
            </div>
          </mat-tab>
 
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="mr-2 neon-icon">inventory_2</mat-icon>
              <span class="neon-text tab-label">Dữ Liệu Đơn Hàng</span>
            </ng-template>
            <div class="tab-content">
               <app-order-table></app-order-table>
            </div>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="mr-2 neon-icon">schedule</mat-icon>
              <span class="neon-text tab-label">Đăng Ký Thời Gian Hỗ Trợ</span>
              <span class="notif-dot" *ngIf="notifCount > 0 && activeTab !== 2">
                {{ notifCount }}
              </span>
            </ng-template>
            <div class="tab-content">
              <app-support-time></app-support-time>
            </div>
          </mat-tab>

          <mat-tab *ngIf="showProfile">
            <ng-template mat-tab-label>
              <mat-icon class="mr-2 neon-icon">manage_accounts</mat-icon>
              <span class="neon-text tab-label">Trang Cá Nhân</span>
            </ng-template>
            <div class="tab-content">
              <app-profile></app-profile>
            </div>
          </mat-tab>

          <mat-tab *ngIf="isAdmin()">
            <ng-template mat-tab-label>
              <mat-icon class="mr-2 neon-icon">manage_accounts</mat-icon>
              <span class="neon-text tab-label">Quản Lý Nhân Sự</span>
            </ng-template>
            <div class="tab-content">
              <app-employee-management></app-employee-management>
            </div>
          </mat-tab>
        </mat-tab-group>
      </main>

      <footer class="footer glass-panel">
        <div class="footer-grid">
          <!-- Column 1: Brand -->
          <div class="footer-col brand">
            <div class="footer-logo">
              <img src="https://innhathan.com/wp-content/uploads/2023/04/cropped-Logo-NH.gif" alt="Logo" class="footer-logo-img">
              <span class="neon-text">NHẬT HÀN ERP</span>
            </div>
            <p class="brand-desc">Hệ thống quản lý sản lượng in ấn thông minh. Tối ưu quy trình, nâng cao hiệu suất.</p>
            <div class="social-icons">
              <button mat-icon-button class="neon-icon-dim"><mat-icon>facebook</mat-icon></button>
              <button mat-icon-button class="neon-icon-dim"><mat-icon>language</mat-icon></button>
              <button mat-icon-button class="neon-icon-dim"><mat-icon>email</mat-icon></button>
            </div>
          </div>

          <!-- Column 2: Quick Links -->
          <div class="footer-col">
            <h4>Điều hướng</h4>
            <ul>
              <li><a (click)="activeTab = 0">Sản Lượng</a></li>
              <li><a (click)="activeTab = 1">Đơn Hàng</a></li>
              <li><a (click)="activeTab = 2">Thời Gian Hỗ Trợ</a></li>
              <li *ngIf="isAdmin()"><a (click)="activeTab = 4">Quản Lý Nhân Sự</a></li>
            </ul>
          </div>

          <!-- Column 3: Support -->
          <div class="footer-col">
            <h4>Hỗ trợ</h4>
            <ul>
              <li><a href="#">Hướng dẫn sử dụng</a></li>
              <li><a href="#">Báo lỗi hệ thống</a></li>
              <li><a href="#">Góp ý tính năng</a></li>
              <li><a href="#">Liên hệ kỹ thuật</a></li>
            </ul>
          </div>

          <!-- Column 4: Status -->
          <div class="footer-col">
            <h4>Hệ thống</h4>
            <div class="status-badge">
              <span class="pulse-dot"></span>
              <span>System Online</span>
            </div>
            <div class="version-info">
              <p>Phiên bản: v1.0.8-ULTIMATE-STABLE</p>
              <p>Build: 2026.04.08.3</p>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>© 2026 In Nhật Hàn ERP | Designed by <span class="neon-text">Lê Dương</span></p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: transparent;
    }
    .header {
      position: fixed;
      top: 0;
      left: 0;
      margin: 0;
      width: 100%;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 32px;
      height: 72px;
      border: none !important;
      border-bottom: 1px solid var(--ag-border) !important;
      border-radius: 0 0 16px 16px !important;
      box-sizing: border-box;
      background: rgba(13, 17, 23, 0.8) !important;
      backdrop-filter: blur(20px) !important;
    }
    .app-logo {
      height: 48px;
      width: 48px;
      object-fit: contain;
      border-radius: 50%;
      background: white;
      padding: 4px;
      margin-right: 12px;
      border: 2px solid var(--ag-neon);
      box-shadow: 0 0 15px var(--ag-neon-glow);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .app-logo:hover {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 0 25px var(--ag-neon);
    }
    .app-title {
      font-weight: 700;
      letter-spacing: 1px;
      background: linear-gradient(135deg, var(--ag-text-primary) 0%, var(--ag-neon) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 1.2rem;
    }
    .neon-text { color: var(--ag-neon); }
    .neon-icon { color: var(--ag-neon); }
    .spacer {
      flex: 1 1 auto;
    }
    .ml-2 { margin-left: 8px; }
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: 20px;
      padding: 6px 16px;
      background: var(--ag-border);
      border-radius: 24px;
      font-size: 0.9rem;
      border: 1px solid var(--ag-border);
      transition: border-color 0.2s;
    }
    .user-profile:hover { border-color: var(--ag-neon) !important; }
    .avatar-img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--ag-neon);
    }
    .avatar-initials {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--ag-neon), #0369a1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      color: white;
      flex-shrink: 0;
    }
    .notif-dot {
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 0.65rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 6px;
    }
    .user-profile img {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid var(--ag-neon);
    }
    .content {
      flex: 1;
      padding: 92px 16px 0; /* Header 72px + distance and horizontal padding */
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
      min-height: 600px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      padding: 24px;
    }
    .tab-content {
      padding: 24px;
    }
    .mr-2 { margin-right: 8px; }
    .tab-label {
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-size: 0.9rem;
    }
    .dashboard-tabs {
       margin: 0 24px 24px;
       border: 1px solid var(--ag-border) !important;
       display: block !important;
       min-height: 500px;
    }
    /* Material MDC Specific Overrides */
    :host ::ng-deep .mat-mdc-tab-root {
      opacity: 1 !important;
      visibility: visible !important;
    }
    :host ::ng-deep .mat-mdc-tab-body-wrapper {
      background: transparent !important;
      min-height: 400px;
    }
    :host ::ng-deep .mdc-tab__text-label {
      color: var(--ag-neon) !important;
    }
    :host ::ng-deep .mat-mdc-tab:not(.mat-mdc-tab-disabled).mdc-tab--active .mdc-tab__text-label {
      color: var(--ag-text-primary) !important;
      text-shadow: 0 0 10px var(--ag-neon-glow);
    }
    :host ::ng-deep .mat-mdc-tab-header {
      background: transparent !important;
    }
    .stat-card {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid var(--ag-border) !important;
    }
    .stat-card:hover {
      transform: translateY(-5px);
      border-color: var(--ag-neon) !important;
      box-shadow: 0 0 20px var(--ag-neon-glow) !important;
    }
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    .stat-icon mat-icon { font-size: 32px; width: 32px; height: 32px; }
    
    .blue .stat-icon { background: rgba(14, 165, 233, 0.15); color: #0ea5e9; }
    .red .stat-icon { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .purple .stat-icon { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
    .orange .stat-icon { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-info .label {
      font-size: 0.8rem;
      color: var(--ag-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .stat-info .value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--ag-text-primary);
    }
    
    .footer {
      margin-top: 40px;
      padding: 48px 24px 24px;
      border: none !important;
      border-top: 1px solid var(--ag-border) !important;
      border-radius: 40px 40px 0 0 !important;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.5fr;
      gap: 40px;
      max-width: 1400px;
      margin: 0 auto;
      padding-bottom: 40px;
    }
    .footer-col h4 {
      color: var(--ag-text-primary);
      font-weight: 800;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 1.5px;
      margin-bottom: 24px;
      display: block;
    }
    .footer-col ul { list-style: none; padding: 0; margin: 0; }
    .footer-col ul li { margin-bottom: 12px; }
    .footer-col ul li a {
      color: var(--ag-text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .footer-col ul li a:hover { color: var(--ag-neon); text-shadow: 0 0 8px var(--ag-neon-glow); }
    
    .footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .footer-logo-img {
      height: 44px;
      width: 44px;
      object-fit: contain;
      border-radius: 50%;
      background: white;
      padding: 4px;
      border: 2px solid var(--ag-neon);
      box-shadow: 0 0 12px var(--ag-neon-glow);
      transition: transform 0.3s ease;
    }
    .footer-logo-img:hover { transform: scale(1.1); }
    .footer-logo span { font-weight: 800; letter-spacing: 2px; font-size: 1.2rem; }
    .brand-desc { color: var(--ag-text-secondary); line-height: 1.6; font-size: 0.9rem; max-width: 300px; }
    
    .neon-icon-dim { color: var(--ag-text-secondary) !important; opacity: 0.7; }
    .neon-icon-dim:hover { color: var(--ag-neon) !important; opacity: 1; }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 20px;
      color: #10b981;
      font-weight: 700;
      font-size: 0.8rem;
      margin-bottom: 16px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .version-info p { margin: 4px 0; font-size: 0.8rem; color: var(--ag-text-secondary); opacity: 0.6; }
    
    .footer-bottom {
      border-top: 1px solid var(--ag-border);
      padding-top: 24px;
      text-align: center;
      font-size: 0.85rem;
      color: var(--ag-text-secondary);
      letter-spacing: 1px;
    }
    
    @media (max-width: 992px) {
      .footer-grid { grid-template-columns: repeat(2, 1fr); gap: 32px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); padding: 0 16px; }
    }
    @media (max-width: 768px) {
      .content { padding: 88px 8px 8px; }
      .header { padding: 0 16px; height: 64px; }
      .app-title { font-size: 0.9rem; }
      .stats-grid { gap: 12px; }
      .stat-card { padding: 15px; }
      .stat-card .value { font-size: 1.3rem; }
      .app-logo { height: 40px; width: 40px; }
      :host ::ng-deep .mat-mdc-tab-link { min-width: 80px !important; padding: 0 12px !important; }
    }
    @media (max-width: 576px) {
      .footer-grid { grid-template-columns: 1fr; text-align: center; }
      .footer-logo, .status-badge { justify-content: center; }
      .brand-desc { margin: 0 auto 16px; }
      .app-title { display: none; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    /* ─── MOBILE HAMBURGER MENU ─── */
    .mobile-menu-btn { display: none; color: var(--ag-neon) !important; }
    .desktop-only { display: inline-flex; }

    @media (max-width: 768px) {
      .mobile-menu-btn { display: inline-flex !important; }
      .desktop-only { display: none !important; }
      .user-profile span { display: none; }
      .user-profile { margin-left: 4px; padding: 4px 8px; }
    }

    .mobile-menu-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 9998;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s;
    }

    .mobile-menu {
      position: fixed;
      top: 0;
      left: -300px;
      width: 280px;
      height: 100vh;
      z-index: 9999;
      background: var(--ag-glass, rgba(13,17,23,0.97));
      border-right: 1px solid var(--ag-border);
      display: flex;
      flex-direction: column;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 5px 0 30px rgba(0,0,0,0.5);
    }
    .mobile-menu.open {
      left: 0;
    }

    .mobile-menu-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 20px;
      border-bottom: 1px solid var(--ag-border);
    }
    .mobile-menu-header img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: white;
      padding: 3px;
      border: 2px solid var(--ag-neon);
    }
    .mobile-menu-header span {
      font-weight: 800;
      font-size: 1.1rem;
      background: linear-gradient(135deg, var(--ag-text-primary), var(--ag-neon));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .mobile-menu-logo { box-shadow: 0 0 12px var(--ag-neon-glow); }

    .mobile-nav {
      flex: 1;
      padding: 12px 0;
      overflow-y: auto;
    }
    .mobile-nav button {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 14px 24px;
      background: none;
      border: none;
      color: var(--ag-text-secondary);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      position: relative;
    }
    .mobile-nav button:hover,
    .mobile-nav button.active {
      background: rgba(14,165,233,0.08);
      color: var(--ag-neon);
    }
    .mobile-nav button.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: var(--ag-neon);
      border-radius: 0 3px 3px 0;
    }
    .mobile-nav button mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .mobile-notif {
      background: #ef4444;
      color: white;
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 0.7rem;
      font-weight: 700;
      margin-left: auto;
    }

    .mobile-menu-footer {
      border-top: 1px solid var(--ag-border);
      padding: 12px 0;
    }
    .mobile-menu-footer button {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 14px 24px;
      background: none;
      border: none;
      color: var(--ag-text-secondary);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .mobile-menu-footer button:hover {
      background: rgba(14,165,233,0.08);
      color: var(--ag-neon);
    }
    .mobile-menu-footer .logout-btn:hover {
      background: rgba(239,68,68,0.08);
      color: #ef4444;
    }
    .mobile-menu-footer button mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  prodService = inject(ProductionService);
  authService = inject(AuthService);
  private supportTimeService = inject(SupportTimeService);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);

  isDarkMode = true;
  activeTab = 0;
  showProfile = false;
  notifCount = 0;
  mobileMenuOpen = false;

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();

    // Watch notification count for managers
    this.supportTimeService.notifications$.subscribe(() => {
      this.notifCount = this.supportTimeService.getUnreadCount();
    });
  }

  getYield(): number {
    const total = this.prodService.getTotalOK() + this.prodService.getTotalLoi();
    return total > 0 ? this.prodService.getTotalOK() / total : 0;
  }

  getUserAvatar(username: string): string | null {
    return localStorage.getItem(`avatar_${username}`);
  }

  getInitials(displayName: string): string {
    return displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    if (this.isDarkMode) {
      this.renderer.removeClass(this.document.body, 'light-mode');
    } else {
      this.renderer.addClass(this.document.body, 'light-mode');
    }
  }
}

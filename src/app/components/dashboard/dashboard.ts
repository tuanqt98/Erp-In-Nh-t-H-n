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
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    ProductionFormComponent,
    ProductionTableComponent,
    OrderTableComponent,
    SupportTimeComponent,
    ProfileComponent,
    EmployeeManagementComponent
  ],
  template: `
    <div class="dashboard-wrapper">
      <!-- ─── SIDEBAR (Desktop) ─── -->
      <aside class="sidebar glass-panel" [class.open]="sidebarOpen">
        <div class="sidebar-header">
           <div class="brand">
             <img src="https://innhathan.com/wp-content/uploads/2023/04/cropped-Logo-NH.gif" alt="Logo" class="sidebar-logo">
             <span class="brand-name">NHẬT HÀN ERP</span>
           </div>
           <button mat-icon-button class="mobile-close-btn" (click)="sidebarOpen = false">
             <mat-icon>close</mat-icon>
           </button>
        </div>

        <!-- User Profile inside Sidebar -->
        <div class="sidebar-profile" *ngIf="authService.currentUser$ | async as user">
          <div class="profile-avatar-wrap">
            <img *ngIf="getUserAvatar(user.username)" [src]="getUserAvatar(user.username)" alt="Avatar" class="profile-avatar">
            <div *ngIf="!getUserAvatar(user.username)" class="profile-initials">{{ getInitials(user.displayName) }}</div>
            <div class="status-indicator"></div>
          </div>
          <div class="profile-info">
            <span class="p-name">{{ user.displayName }}</span>
            <span class="p-role">{{ isAdmin() ? 'Quản Trị Viên' : 'Thợ In' }}</span>
          </div>
          <button mat-icon-button [matMenuTriggerFor]="profileMenu" class="p-options">
            <mat-icon>expand_more</mat-icon>
          </button>
          <mat-menu #profileMenu="matMenu" class="glass-panel">
            <button mat-menu-item (click)="activeTab = 3; sidebarOpen = false">
              <mat-icon>person</mat-icon>
              <span>Hồ sơ cá nhân</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="authService.logout()">
              <mat-icon class="text-red">logout</mat-icon>
              <span class="text-red">Đăng xuất</span>
            </button>
          </mat-menu>
        </div>

        <!-- Sidebar Search -->
        <div class="sidebar-search">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput placeholder="Tìm kiếm chức năng..." (keyup)="filterMenu($event)">
          </mat-form-field>
        </div>

        <nav class="sidebar-nav">
          <div class="menu-group">DANH MỤC CHÍNH</div>
          
          <button class="nav-item" [class.active]="activeTab === 0" (click)="activeTab = 0; sidebarOpen = false">
            <mat-icon>analytics</mat-icon>
            <span>Quản Lý Sản Lượng</span>
          </button>

          <button class="nav-item" [class.active]="activeTab === 1" (click)="activeTab = 1; sidebarOpen = false">
            <mat-icon>inventory_2</mat-icon>
            <span>Dữ Liệu Đơn Hàng</span>
          </button>

          <button class="nav-item" [class.active]="activeTab === 2" (click)="activeTab = 2; sidebarOpen = false">
            <mat-icon [matBadge]="notifCount > 0 ? notifCount : null" matBadgeColor="warn" matBadgeSize="small">schedule</mat-icon>
            <span>Đăng Ký Hỗ Trợ</span>
          </button>

          <div class="menu-group" *ngIf="isAdmin()">HỆ THỐNG</div>
          
          <button class="nav-item" *ngIf="isAdmin()" [class.active]="activeTab === 4" (click)="activeTab = 4; sidebarOpen = false">
            <mat-icon>people</mat-icon>
            <span>Quản Lý Nhân Sự</span>
          </button>

          <button class="nav-item" (click)="activeTab = 3; sidebarOpen = false" [class.active]="activeTab === 3">
            <mat-icon>settings</mat-icon>
            <span>Cấu Hình</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button mat-button class="theme-toggle" (click)="toggleTheme()">
            <mat-icon>{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
            <span>{{ isDarkMode ? 'Giao diện sáng' : 'Giao diện tối' }}</span>
          </button>
          <button mat-button class="logout-btn" (click)="authService.logout()">
            <mat-icon>logout</mat-icon>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <!-- ─── MOBILE HEADER (Visible only on mobile) ─── -->
      <mat-toolbar class="mobile-header header glass-panel" *ngIf="true">
        <button mat-icon-button (click)="sidebarOpen = true">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="app-title">Nhật Hàn ERP</span>
        <span class="spacer"></span>
        <div class="user-profile-mini" (click)="activeTab = 3">
           <div class="avatar-mini">{{ getInitials((authService.currentUser$ | async)?.displayName || 'U') }}</div>
        </div>
      </mat-toolbar>

      <div class="mobile-menu-backdrop" *ngIf="sidebarOpen" (click)="sidebarOpen = false"></div>


      <div class="main-content-area">
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
  
            <mat-tab *ngIf="showProfile || activeTab === 3">
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
      </div>

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
    .dashboard-wrapper {
      display: flex;
      min-height: 100vh;
      background: var(--ag-snow-bg);
    }

    /* ─── SIDEBAR STYLES ─── */
    .sidebar {
      width: 280px;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      display: flex;
      flex-direction: column;
      z-index: 1001;
      border-radius: 0 24px 24px 0 !important;
      border-left: none !important;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-header {
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sidebar-logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: white;
      padding: 3px;
      border: 1px solid var(--ag-neon);
      box-shadow: 0 0 10px var(--ag-neon-glow);
    }
    .brand-name {
      font-weight: 800;
      font-size: 1.1rem;
      letter-spacing: 1px;
      background: linear-gradient(135deg, var(--ag-text-primary), var(--ag-neon));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .mobile-close-btn { display: none; }

    /* Profile Section */
    .sidebar-profile {
      margin: 0 16px 20px;
      padding: 16px;
      background: rgba(255,255,255,0.03);
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid var(--ag-border);
    }
    .profile-avatar-wrap {
      position: relative;
    }
    .profile-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2px solid var(--ag-neon);
      object-fit: cover;
    }
    .profile-initials {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--ag-neon), #0369a1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.9rem;
      color: white;
    }
    .status-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 10px;
      height: 10px;
      background: #10b981;
      border: 2px solid #0d1117;
      border-radius: 50%;
    }
    .profile-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .p-name {
      font-weight: 700;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .p-role {
      font-size: 0.75rem;
      color: var(--ag-text-secondary);
    }
    .p-options { color: var(--ag-text-secondary); }

    /* Search */
    .sidebar-search {
      margin: 0 16px 24px;
    }
    .sidebar-search ::ng-deep .mat-mdc-form-field-flex {
      background: rgba(255,255,255,0.02) !important;
      border-radius: 12px !important;
    }
    .sidebar-search ::ng-deep .mat-mdc-form-field-infix {
      padding: 8px 0 !important;
      min-height: 40px !important;
    }
    .sidebar-search mat-icon { font-size: 18px; color: var(--ag-text-secondary); }

    /* Nav Items */
    .sidebar-nav {
      flex: 1;
      padding: 0 16px;
      overflow-y: auto;
    }
    .menu-group {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--ag-text-secondary);
      letter-spacing: 1.5px;
      margin: 20px 0 12px 12px;
      opacity: 0.6;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: none;
      color: var(--ag-text-secondary);
      font-family: inherit;
      font-weight: 500;
      font-size: 0.9rem;
      cursor: pointer;
      border-radius: 12px;
      margin-bottom: 4px;
      transition: all 0.2s;
    }
    .nav-item mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .nav-item:hover {
      background: rgba(14,165,233,0.06);
      color: var(--ag-neon);
    }
    .nav-item.active {
      background: linear-gradient(90deg, rgba(14,165,233,0.1) 0%, transparent 100%);
      color: var(--ag-neon);
      font-weight: 700;
      border-left: 3px solid var(--ag-neon);
      border-radius: 0 12px 12px 0;
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--ag-border);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sidebar-footer button {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
      color: var(--ag-text-secondary);
      justify-content: flex-start;
      width: 100%;
      padding: 12px 16px;
      border-radius: 12px;
    }
    .sidebar-footer button:hover { background: rgba(255,255,255,0.05); color: var(--ag-text-primary); }
    .logout-btn { color: #ef4444 !important; }

    /* ─── MAIN CONTENT AREA ─── */
    .main-content-area {
      flex: 1;
      margin-left: 280px;
      transition: margin 0.3s;
    }

    .content {
      padding: 32px;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* Mobile Header */
    .mobile-header {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      z-index: 1000;
      padding: 0 16px;
      height: 64px;
      align-items: center;
      justify-content: space-between;
      border-radius: 0 0 16px 16px !important;
    }

    @media (max-width: 992px) {
      .sidebar {
        transform: translateX(-100%);
        border-radius: 0 !important;
      }
      .sidebar.open {
        transform: translateX(0);
      }
      .mobile-close-btn { display: block; color: var(--ag-text-secondary); }
      .main-content-area {
        margin-left: 0;
      }
      .mobile-header { display: flex; }
      .content { padding-top: 80px; }
    }

    .text-red { color: #ef4444 !important; }

    /* Keep existing sub-styles... */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .dashboard-tabs {
       border: 1px solid var(--ag-border) !important;
       min-height: 500px;
    }
    .tab-content { padding: 24px; }
    .stat-card {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.3s;
    }
    .stat-card:hover { transform: translateY(-5px); border-color: var(--ag-neon) !important; }
    .stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
    .blue .stat-icon { background: rgba(14, 165, 233, 0.15); color: #0ea5e9; }
    .red .stat-icon { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .purple .stat-icon { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
    .orange .stat-icon { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .stat-info .label { font-size: 0.75rem; color: var(--ag-text-secondary); text-transform: uppercase; font-weight: 700; }
    .stat-info .value { font-size: 1.5rem; font-weight: 800; color: var(--ag-text-primary); }
    
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
  sidebarOpen = false;
  menuSearch = '';

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

  filterMenu(event: Event) {
    this.menuSearch = (event.target as HTMLInputElement).value.toLowerCase();
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

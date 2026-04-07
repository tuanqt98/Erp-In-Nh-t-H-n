import { Component, OnInit, AfterViewInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { Employee, PHONG_BAN_OPTIONS, CHUC_VU_OPTIONS } from '../../models/employee.model';

interface ImportRow {
  maNhanVien: string;
  tenNhanVien: string;
  phongBan: string;
  status: 'new' | 'duplicate' | 'error';
  errorMsg?: string;
}

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatDatepickerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="hr-layout">

      <!-- HEADER ROW -->
      <div class="hr-header glass-panel">
        <div class="hr-title-row">
          <h2 class="section-title">
            <mat-icon>people</mat-icon>
            Quản Lý Nhân Sự
          </h2>
          <div class="hr-meta">
            <span class="meta-chip blue">
              <mat-icon>badge</mat-icon>
              {{ totalActive }} nhân viên đang làm
            </span>
            <span class="meta-chip grey">
              <mat-icon>groups</mat-icon>
              {{ totalDepts }} phòng ban
            </span>
          </div>
        </div>

        <!-- Toolbar: Search + Add -->
        <div class="toolbar-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Tìm kiếm nhân viên...</mat-label>
            <input matInput [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" placeholder="Mã NV, Tên, Phòng ban...">
            <mat-icon matSuffix class="neon-icon">search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Phòng ban</mat-label>
            <mat-select [(ngModel)]="filterDept" (ngModelChange)="applyFilter()">
              <mat-option value="">Tất cả</mat-option>
              <mat-option *ngFor="let d of phongBanOptions" [value]="d">{{ d }}</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-raised-button class="btn-add" (click)="openForm()" *ngIf="isAdmin()">
            <mat-icon>person_add</mat-icon>
            Thêm Nhân Viên
          </button>
          <button mat-stroked-button class="btn-import" (click)="importFileInput.click()" *ngIf="isAdmin()"
                  matTooltip="Import danh sách nhân viên từ Excel (.xlsx, .xls)">
            <mat-icon>upload_file</mat-icon>
            Import Excel
          </button>
          <button mat-stroked-button class="btn-template" (click)="downloadTemplate()" *ngIf="isAdmin()"
                  matTooltip="Tải file mẫu Excel">
            <mat-icon>download</mat-icon>
            File Mẫu
          </button>
          <input #importFileInput type="file" accept=".xlsx,.xls,.csv" style="display:none"
                 (change)="onImportFile($event)">
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-container glass-panel">
        <div class="table-responsive">
          <table mat-table [dataSource]="dataSource" matSort>

            <ng-container matColumnDef="maNhanVien">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Mã NV</th>
              <td mat-cell *matCellDef="let row">
                <span class="code-badge">{{ row.maNhanVien }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="tenNhanVien">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Tên Nhân Viên</th>
              <td mat-cell *matCellDef="let row">
                <div class="name-cell">
                  <div class="avatar-sm">{{ row.tenNhanVien[0] }}</div>
                  <div class="name-info">
                    <span class="name">{{ row.tenNhanVien }}</span>
                    <span class="login-hint">Đăng nhập: {{ row.maNhanVien }} / mật khẩu: 1</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="phongBan">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Phòng Ban</th>
              <td mat-cell *matCellDef="let row">
                <span class="dept-badge">{{ row.phongBan }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Quyền Hạn</th>
              <td mat-cell *matCellDef="let row">
                <select *ngIf="isAdmin()" class="role-select"
                        [(ngModel)]="roleMap[row.id]"
                        (ngModelChange)="onRoleChange(row, $event)">
                  <option value="staff">👤 Nhân Viên</option>
                  <option value="manager">💼 Quản Lý SX</option>
                  <option value="admin">👑 Quản Trị Viên</option>
                </select>
                <span *ngIf="!isAdmin()" class="role-badge" [ngClass]="'rbadge-' + (roleMap[row.id] || 'staff')">
                  {{ getRoleLabel(roleMap[row.id] || 'staff') }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="chucVu">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Chức Vụ</th>
              <td mat-cell *matCellDef="let row">{{ row.chucVu }}</td>
            </ng-container>

            <ng-container matColumnDef="ngayVaoLam">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Ngày Vào Làm</th>
              <td mat-cell *matCellDef="let row">{{ formatDate(row.ngayVaoLam) }}</td>
            </ng-container>

            <ng-container matColumnDef="trangThai">
              <th mat-header-cell *matHeaderCellDef>Trạng Thái</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-chip" [ngClass]="row.trangThai === 'active' ? 'status-active' : 'status-inactive'">
                  <mat-icon>{{ row.trangThai === 'active' ? 'check_circle' : 'cancel' }}</mat-icon>
                  {{ row.trangThai === 'active' ? 'Đang làm' : 'Nghỉ việc' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Thao Tác</th>
              <td mat-cell *matCellDef="let row">
                <div class="action-btns" *ngIf="isAdmin()">
                  <button mat-icon-button class="btn-edit" (click)="openForm(row)" matTooltip="Sửa">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button class="btn-reset" (click)="resetPassword(row)" matTooltip="Reset mật khẩu về 1">
                    <mat-icon>lock_reset</mat-icon>
                  </button>
                  <button mat-icon-button class="btn-delete" (click)="deleteEmployee(row)" matTooltip="Xóa">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                <span *ngIf="!isAdmin()" class="no-action">—</span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="ag-row"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell empty-cell" colspan="7">
                <mat-icon>people_outline</mat-icon>
                <span>Chưa có nhân viên nào</span>
              </td>
            </tr>
          </table>
        </div>
        <mat-paginator [pageSizeOptions]="[10, 25, 50]" aria-label="Chọn trang"></mat-paginator>
      </div>

      <!-- FORM DIALOG (Inline) -->
      <div class="form-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="form-card glass-panel" (click)="$event.stopPropagation()">
          <div class="form-header">
            <h3>
              <mat-icon>{{ editingEmployee ? 'edit' : 'person_add' }}</mat-icon>
              {{ editingEmployee ? 'Sửa Thông Tin Nhân Viên' : 'Thêm Nhân Viên Mới' }}
            </h3>
            <button mat-icon-button (click)="closeForm()" class="btn-close-form">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form [formGroup]="empForm" (ngSubmit)="saveEmployee()">
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Mã Nhân Viên *</mat-label>
                <input matInput formControlName="maNhanVien" placeholder="VD: NV001" oninput="this.value = this.value.toUpperCase()">
                <mat-icon matSuffix class="neon-icon">badge</mat-icon>
                <mat-hint>Dùng làm tên đăng nhập</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Họ và Tên *</mat-label>
                <input matInput formControlName="tenNhanVien">
                <mat-icon matSuffix class="neon-icon">person</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phòng Ban *</mat-label>
                <mat-select formControlName="phongBan">
                  <mat-option *ngFor="let d of phongBanOptions" [value]="d">{{ d }}</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Chức Vụ *</mat-label>
                <mat-select formControlName="chucVu">
                  <mat-option *ngFor="let c of chucVuOptions" [value]="c">{{ c }}</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Ngày Vào Làm</mat-label>
                <input matInput [matDatepicker]="joinPicker" formControlName="ngayVaoLam">
                <mat-datepicker-toggle matIconSuffix [for]="joinPicker"></mat-datepicker-toggle>
                <mat-datepicker #joinPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Trạng Thái</mat-label>
                <mat-select formControlName="trangThai">
                  <mat-option value="active">Đang làm việc</mat-option>
                  <mat-option value="inactive">Nghỉ việc</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email">
                <mat-icon matSuffix class="neon-icon">email</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Số Điện Thoại</mat-label>
                <input matInput formControlName="soDienThoai">
                <mat-icon matSuffix class="neon-icon">phone</mat-icon>
              </mat-form-field>
            </div>

            <!-- Account info notice -->
            <div class="account-notice" *ngIf="!editingEmployee">
              <mat-icon>info</mat-icon>
              <span>Tài khoản đăng nhập sẽ được tạo tự động:<br>
                <strong>Tên đăng nhập:</strong> {{ empForm.get('maNhanVien')?.value || 'Mã NV' }}&nbsp;&nbsp;
                <strong>Mật khẩu:</strong> 1
              </span>
            </div>

            <div class="form-actions">
              <button mat-button type="button" (click)="closeForm()" class="btn-cancel">Hủy</button>
              <button mat-raised-button type="submit" [disabled]="empForm.invalid" class="btn-save">
                <mat-icon>save</mat-icon>
                {{ editingEmployee ? 'Cập Nhật' : 'Thêm Mới' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- IMPORT PREVIEW DIALOG -->
      <div class="form-overlay" *ngIf="showImportPreview" (click)="closeImportPreview()">
        <div class="import-card glass-panel" (click)="$event.stopPropagation()">
          <div class="form-header">
            <h3>
              <mat-icon>upload_file</mat-icon>
              Xem Trước Dữ Liệu Import
            </h3>
            <button mat-icon-button (click)="closeImportPreview()" class="btn-close-form">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Summary badges -->
          <div class="import-summary">
            <span class="summary-chip green">
              <mat-icon>check_circle</mat-icon>
              {{ importPreview.newCount }} nhân viên mới
            </span>
            <span class="summary-chip orange" *ngIf="importPreview.dupCount > 0">
              <mat-icon>warning</mat-icon>
              {{ importPreview.dupCount }} trùng mã (bỏ qua)
            </span>
            <span class="summary-chip red" *ngIf="importPreview.errCount > 0">
              <mat-icon>error</mat-icon>
              {{ importPreview.errCount }} lỗi
            </span>
          </div>

          <!-- Preview Table -->
          <div class="import-table-wrap">
            <table class="import-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mã NV</th>
                  <th>Tên Nhân Viên</th>
                  <th>Phòng Ban</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of importPreview.rows; let i = index"
                    [ngClass]="'row-' + row.status">
                  <td>{{ i + 1 }}</td>
                  <td><span class="code-badge">{{ row.maNhanVien }}</span></td>
                  <td>{{ row.tenNhanVien }}</td>
                  <td>{{ row.phongBan }}</td>
                  <td>
                    <span class="import-status" [ngClass]="'istatus-' + row.status">
                      <mat-icon>{{ row.status === 'new' ? 'add_circle' : row.status === 'duplicate' ? 'warning' : 'error' }}</mat-icon>
                      {{ row.status === 'new' ? 'Thêm mới' : row.status === 'duplicate' ? 'Trùng mã' : row.errorMsg }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="form-actions">
            <button mat-button (click)="closeImportPreview()" class="btn-cancel">Hủy</button>
            <button mat-raised-button (click)="confirmImport()" class="btn-save"
                    [disabled]="importPreview.newCount === 0">
              <mat-icon>save</mat-icon>
              Import {{ importPreview.newCount }} Nhân Viên
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hr-layout {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    /* Header panel */
    .hr-header {
      padding: 24px 28px;
    }
    .hr-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      font-size: 1.4rem;
      color: var(--ag-text-primary);
      margin: 0;
    }
    .section-title mat-icon { color: var(--ag-neon); font-size: 28px; }
    .hr-meta {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .meta-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .meta-chip mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .meta-chip.blue { background: rgba(14,165,233,0.12); color: var(--ag-neon); border: 1px solid rgba(14,165,233,0.3); }
    .meta-chip.grey { background: var(--ag-neon-glow); color: var(--ag-text-secondary); border: 1px solid var(--ag-border); }

    .toolbar-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .search-field { flex: 2; min-width: 220px; }
    .filter-field { flex: 1; min-width: 160px; max-width: 220px; }
    .neon-icon { color: var(--ag-neon) !important; }
    .btn-add {
      background: linear-gradient(135deg, var(--ag-neon), #0369a1) !important;
      color: white !important;
      font-weight: 600 !important;
      white-space: nowrap;
    }
    .btn-add:hover { box-shadow: 0 0 15px var(--ag-neon-glow) !important; }

    /* Role select & badge */
    .role-select {
      background: var(--ag-glass);
      color: var(--ag-text-primary);
      border: 1px solid var(--ag-border);
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 0.82rem;
      font-family: inherit;
      cursor: pointer;
      outline: none;
      transition: border-color 0.2s;
    }
    .role-select:focus { border-color: var(--ag-neon); }
    .role-select option { background: var(--ag-bg-base); color: var(--ag-text-primary); }
    .role-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .rbadge-admin { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,.3); }
    .rbadge-manager { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,.3); }
    .rbadge-staff { background: rgba(14,165,233,0.12); color: var(--ag-neon); border: 1px solid rgba(14,165,233,.3); }

    /* Table */
    .table-container { padding: 0 0 16px; overflow: hidden; }
    .table-responsive { overflow-x: auto; }
    table { width: 100%; }
    :host ::ng-deep .mat-mdc-table { background: transparent !important; }
    :host ::ng-deep .mat-mdc-row { background: transparent !important; transition: background 0.2s; }
    :host ::ng-deep .mat-mdc-row:hover { background: var(--ag-neon-glow) !important; }
    :host ::ng-deep .mat-mdc-header-row { background: rgba(255,255,255,0.03) !important; }
    :host ::ng-deep .mat-mdc-cell { color: var(--ag-text-primary) !important; background: transparent !important; border-bottom: 1px solid var(--ag-border) !important; }
    :host ::ng-deep .mat-mdc-header-cell { color: var(--ag-text-secondary) !important; background: transparent !important; font-weight: 700; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 1px; border-bottom: 1px solid var(--ag-border) !important; }
    :host ::ng-deep .mat-mdc-paginator { background: transparent !important; color: var(--ag-text-secondary) !important; }

    /* Cells */
    .code-badge {
      font-family: monospace;
      background: rgba(14,165,233,0.12);
      color: var(--ag-neon);
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 700;
      border: 1px solid rgba(14,165,233,0.3);
    }
    .name-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar-sm {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--ag-neon), #0369a1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      flex-shrink: 0;
    }
    .name-info { display: flex; flex-direction: column; }
    .name { font-weight: 600; font-size: 0.95rem; }
    .login-hint { font-size: 0.72rem; color: var(--ag-text-secondary); font-family: monospace; }
    .dept-badge {
      background: rgba(168,85,247,0.12);
      color: #a855f7;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid rgba(168,85,247,0.3);
      white-space: nowrap;
    }
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .status-chip mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .status-active { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .status-inactive { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .action-btns { display: flex; align-items: center; }
    .btn-edit { color: var(--ag-neon) !important; }
    .btn-reset { color: #f59e0b !important; }
    .btn-delete { color: #ef4444 !important; }
    .no-action { color: var(--ag-text-secondary); }
    .empty-cell {
      text-align: center;
      padding: 48px !important;
      color: var(--ag-text-secondary) !important;
    }
    :host ::ng-deep .mat-mdc-no-data-row td {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px !important;
    }

    /* Form dialog */
    .form-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(6px);
    }
    .form-card {
      padding: 32px;
      max-width: 700px;
      width: 95%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .form-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .form-header h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      font-size: 1.2rem;
      color: var(--ag-text-primary);
      margin: 0;
    }
    .form-header h3 mat-icon { color: var(--ag-neon); }
    .btn-close-form { color: var(--ag-text-secondary) !important; }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } }

    .account-notice {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 16px 0;
      padding: 12px 16px;
      background: rgba(14,165,233,0.08);
      border: 1px solid rgba(14,165,233,0.25);
      border-radius: 10px;
      font-size: 0.875rem;
      color: var(--ag-text-primary);
    }
    .account-notice mat-icon { color: var(--ag-neon); flex-shrink: 0; margin-top: 2px; }
    .account-notice strong { color: var(--ag-neon); }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }
    .btn-save {
      background: linear-gradient(135deg, var(--ag-neon), #0369a1) !important;
      color: white !important;
      font-weight: 600 !important;
    }
    .btn-save:hover { box-shadow: 0 0 15px var(--ag-neon-glow) !important; }
    .btn-cancel { color: var(--ag-text-secondary) !important; }
    .btn-import {
      color: #22c55e !important;
      border-color: rgba(34,197,94,0.4) !important;
      white-space: nowrap;
    }
    .btn-import:hover { background: rgba(34,197,94,0.08) !important; }
    .btn-template {
      color: var(--ag-text-secondary) !important;
      border-color: var(--ag-border) !important;
      white-space: nowrap;
    }

    /* Import preview */
    .import-card {
      padding: 24px;
      max-width: 860px;
      width: 95%;
      height: calc(100vh - 120px) !important;
      display: grid !important;
      grid-template-rows: auto auto 1fr auto !important; /* Title, Summary, Table (Scrolls), Actions */
      overflow: hidden !important;
      box-sizing: border-box;
      gap: 0;
    }
    .import-card h3 { margin: 0 0 16px !important; }
    .import-summary { margin-bottom: 16px !important; }
    .import-table-wrap { 
      min-height: 0 !important;
      overflow: auto !important; 
      border-radius: 8px; 
      border: 1px solid var(--ag-border); 
      background: rgba(0,0,0,0.1);
    }
    .form-actions { 
      padding-top: 20px;
      margin-top: 10px;
      border-top: 1px solid var(--ag-border);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .import-summary {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .summary-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .summary-chip mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .summary-chip.green { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .summary-chip.orange { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .summary-chip.red { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .import-table-wrap { overflow-x: auto; margin-bottom: 12px; border-radius: 10px; border: 1px solid var(--ag-border); }
    .import-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .import-table thead tr { background: rgba(255,255,255,0.04); }
    .import-table th {
      padding: 10px 14px;
      text-align: left;
      color: var(--ag-text-secondary);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      border-bottom: 1px solid var(--ag-border);
    }
    .import-table td {
      padding: 10px 14px;
      color: var(--ag-text-primary);
      border-bottom: 1px solid var(--ag-border);
    }
    .import-table tr:last-child td { border-bottom: none; }
    .row-duplicate { opacity: 0.55; }
    .row-error { opacity: 0.55; }
    .import-status { display: inline-flex; align-items: center; gap: 4px; font-size: 0.8rem; font-weight: 600; }
    .import-status mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .istatus-new { color: #22c55e; }
    .istatus-duplicate { color: #f59e0b; }
    .istatus-error { color: #ef4444; }
  `]
})
export class EmployeeManagementComponent implements OnInit, AfterViewInit {
  private empService = inject(EmployeeService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Employee>([]);
  displayedColumns = ['maNhanVien', 'tenNhanVien', 'phongBan', 'chucVu', 'role', 'ngayVaoLam', 'trangThai', 'actions'];

  // role cache: employeeId -> role
  roleMap: Record<string, string> = {};

  phongBanOptions = PHONG_BAN_OPTIONS;
  chucVuOptions = CHUC_VU_OPTIONS;

  searchTerm = '';
  filterDept = '';

  showForm = false;
  editingEmployee: Employee | null = null;

  // Import state
  showImportPreview = false;
  importPreview: { rows: ImportRow[]; newCount: number; dupCount: number; errCount: number } = {
    rows: [], newCount: 0, dupCount: 0, errCount: 0
  };

  get totalActive() { return this.empService.employees.filter(e => e.trangThai === 'active').length; }
  get totalDepts() { return new Set(this.empService.employees.map(e => e.phongBan)).size; }

  empForm: FormGroup = this.fb.group({
    maNhanVien:  ['', [Validators.required, Validators.pattern(/^[A-Z0-9\-_]+$/)]],
    tenNhanVien: ['', Validators.required],
    phongBan:    ['', Validators.required],
    chucVu:      ['', Validators.required],
    ngayVaoLam:  [new Date()],
    trangThai:   ['active', Validators.required],
    email:       [''],
    soDienThoai: [''],
  });

  isAdmin() { return this.authService.isAdmin(); }

  ngOnInit(): void {
    // Load role map ONCE before subscribing so dropdowns have correct initial values
    this.loadRoleMap();

    this.empService.employees$.subscribe(emps => {
      this.dataSource.data = emps;
      // Merge only NEW employees into roleMap — never overwrite existing entries
      // This prevents the (change) event from firing on all rows during re-render
      const accounts = this.empService.loadAccounts();
      emps.forEach(e => {
        if (!(e.id in this.roleMap)) {
          const acc = accounts.find(a => a.employeeId === e.id);
          this.roleMap[e.id] = acc?.role ?? 'staff';
        }
      });
      this.applyFilter();
    });
  }

  private loadRoleMap(): void {
    const accounts = this.empService.loadAccounts();
    // Build a new map but do NOT replace the entire object reference
    // to avoid triggering Angular CD on all rows simultaneously
    const newMap: Record<string, string> = {};
    accounts.forEach(a => { newMap[a.employeeId] = a.role ?? 'staff'; });
    // Only update entries that changed
    this.empService.employees.forEach(e => {
      if (!this.roleMap[e.id]) {
        this.roleMap[e.id] = newMap[e.id] ?? 'staff';
      }
    });
  }

  onRoleChange(emp: Employee, role: string): void {
    // ngModel already updated roleMap[emp.id], just persist it
    this.empService.setRole(emp.id, role as any);
    this.snackBar.open(
      `✅ Đã đổi quyền "${emp.tenNhanVien}" thành ${this.getRoleLabel(role)}`,
      'Đóng',
      { duration: 2500 }
    );
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = { admin: 'Quản Trị Viên', manager: 'Quản Lý SX', staff: 'Nhân Viên' };
    return labels[role] ?? role;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // ─── EXCEL IMPORT ────────────────────────────────────────────────────────────

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = ''; // reset so same file can be re-selected

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        this.parseImportData(raw);
      } catch {
        this.snackBar.open('❌ File không hợp lệ hoặc bị lỗi!', 'Đóng', { duration: 3000 });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  private normalizeHeader(h: string): string {
    return h.toString().toLowerCase()
      .replace(/[\s_\-\.]+/g, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove diacritics
  }

  private parseImportData(raw: any[][]): void {
    if (raw.length < 2) {
      this.snackBar.open('❌ File trống hoặc không có dữ liệu!', 'Đóng', { duration: 3000 });
      return;
    }

    // Detect header row (first row)
    const headers = (raw[0] as string[]).map(h => this.normalizeHeader(String(h)));

    const colMap = { ma: -1, ten: -1, phong: -1 };
    headers.forEach((h, i) => {
      if (/ma.*nv|manhanvien|employee.*code|ma.*nhan|nv.*ma/.test(h)) colMap.ma = i;
      else if (/ten.*nv|tennhanvien|employee.*name|ten.*nhan|hoten|fullname/.test(h)) colMap.ten = i;
      else if (/phong.*ban|phongban|department|phong/.test(h)) colMap.phong = i;
    });

    // fallback: positional (col 0=ma, 1=ten, 2=phong)
    if (colMap.ma === -1) colMap.ma = 0;
    if (colMap.ten === -1) colMap.ten = 1;
    if (colMap.phong === -1) colMap.phong = 2;

    const rows: ImportRow[] = [];
    for (let i = 1; i < raw.length; i++) {
      const row = raw[i];
      const ma = String(row[colMap.ma] ?? '').trim().toUpperCase();
      const ten = String(row[colMap.ten] ?? '').trim();
      const phong = String(row[colMap.phong] ?? '').trim();

      if (!ma && !ten) continue; // skip empty rows

      let status: ImportRow['status'] = 'new';
      let errorMsg = '';

      if (!ma) { status = 'error'; errorMsg = 'Thiếu mã NV'; }
      else if (!ten) { status = 'error'; errorMsg = 'Thiếu tên NV'; }
      else if (!phong) { status = 'error'; errorMsg = 'Thiếu phòng ban'; }
      else if (this.empService.isDuplicateCode(ma)) { status = 'duplicate'; }
      else if (rows.some(r => r.maNhanVien === ma && r.status === 'new')) {
        status = 'duplicate'; errorMsg = 'Trùng trong file';
      }

      rows.push({ maNhanVien: ma, tenNhanVien: ten, phongBan: phong, status, errorMsg });
    }

    this.importPreview = {
      rows,
      newCount: rows.filter(r => r.status === 'new').length,
      dupCount: rows.filter(r => r.status === 'duplicate').length,
      errCount: rows.filter(r => r.status === 'error').length,
    };
    this.showImportPreview = true;
  }

  closeImportPreview(): void {
    this.showImportPreview = false;
  }

  confirmImport(): void {
    const toImport = this.importPreview.rows.filter(r => r.status === 'new');

    // Use addBatch() — single save() call with crypto.randomUUID() per item
    // This prevents the Date.now() collision that caused duplicate IDs
    this.empService.addBatch(toImport.map(r => ({
      maNhanVien: r.maNhanVien,
      tenNhanVien: r.tenNhanVien,
      phongBan: r.phongBan,
      chucVu: 'Công Nhân',
      trangThai: 'active' as const,
      ngayVaoLam: new Date().toISOString().split('T')[0],
    })));

    this.closeImportPreview();
    this.snackBar.open(
      `✅ Đã import ${toImport.length} nhân viên! Tất cả đăng nhập bằng MK: 1`,
      'Đóng',
      { duration: 5000 }
    );
  }

  downloadTemplate(): void {
    const templateData = [
      ['Mã Nhân Viên', 'Tên Nhân Viên', 'Phòng Ban'],
      ['NV001', 'Nguyễn Văn A', 'Phòng In'],
      ['NV002', 'Trần Thị B', 'Phòng Cắt'],
      ['NV003', 'Lê Văn C', 'Phòng KCS'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    // Style header row width
    ws['!cols'] = [{ wch: 16 }, { wch: 25 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh Sach NV');
    XLSX.writeFile(wb, 'mau_import_nhan_vien.xlsx');
    this.snackBar.open('📥 Đã tải file mẫu!', 'Đóng', { duration: 2000 });
  }

  // ─────────────────────────────────────────────────────────────────────────────

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.dataSource.data = this.empService.employees.filter(e => {
      const matchSearch = !term ||
        e.maNhanVien.toLowerCase().includes(term) ||
        e.tenNhanVien.toLowerCase().includes(term) ||
        e.phongBan.toLowerCase().includes(term) ||
        e.chucVu.toLowerCase().includes(term);
      const matchDept = !this.filterDept || e.phongBan === this.filterDept;
      return matchSearch && matchDept;
    });
  }

  openForm(emp?: Employee): void {
    this.editingEmployee = emp ?? null;
    if (emp) {
      this.empForm.patchValue({
        ...emp,
        ngayVaoLam: emp.ngayVaoLam ? new Date(emp.ngayVaoLam) : new Date()
      });
      this.empForm.get('maNhanVien')?.disable();  // Can't change employee code after creation
    } else {
      this.empForm.reset({ trangThai: 'active', ngayVaoLam: new Date() });
      this.empForm.get('maNhanVien')?.enable();
      this.empForm.patchValue({ maNhanVien: this.empService.generateMaNV() });
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingEmployee = null;
    this.empForm.get('maNhanVien')?.enable();
  }

  saveEmployee(): void {
    if (this.empForm.invalid) return;
    const val = { ...this.empForm.getRawValue() }; // getRawValue() includes disabled fields

    // Format date
    if (val.ngayVaoLam instanceof Date) {
      val.ngayVaoLam = val.ngayVaoLam.toISOString().split('T')[0];
    }

    if (this.editingEmployee) {
      // Check duplicate code only if changed
      this.empService.update(this.editingEmployee.id, val);
      this.snackBar.open('✅ Đã cập nhật thông tin nhân viên!', 'Đóng', { duration: 3000 });
    } else {
      // Check duplicate maNhanVien
      if (this.empService.isDuplicateCode(val.maNhanVien)) {
        this.snackBar.open('❌ Mã nhân viên đã tồn tại!', 'Đóng', { duration: 3000 });
        return;
      }
      this.empService.add(val);
      this.snackBar.open(`✅ Đã thêm nhân viên! TK: ${val.maNhanVien} / MK: 1`, 'Đóng', { duration: 4000 });
    }
    this.closeForm();
  }

  deleteEmployee(emp: Employee): void {
    if (confirm(`Xóa nhân viên "${emp.tenNhanVien}" (${emp.maNhanVien})?\nTài khoản đăng nhập cũng sẽ bị xóa.`)) {
      this.empService.delete(emp.id);
      this.snackBar.open('Đã xóa nhân viên.', 'Đóng', { duration: 2000 });
    }
  }

  resetPassword(emp: Employee): void {
    if (confirm(`Reset mật khẩu của "${emp.tenNhanVien}" về "1"?`)) {
      this.empService.resetPassword(emp.id);
      this.snackBar.open('✅ Đã reset mật khẩu về 1!', 'Đóng', { duration: 2000 });
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch { return dateStr; }
  }
}

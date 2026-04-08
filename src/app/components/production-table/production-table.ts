import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductionService } from '../../services/production.service';
import { AuthService } from '../../services/auth.service';
import { ProductionRecord, CONG_DOAN_OPTIONS, NHAN_VIEN_OPTIONS, MAY_OPTIONS } from '../../models/production.model';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-production-table',
  standalone: true,
  imports: [
    CommonModule,
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
    MatSnackBarModule,
  ],
  template: `
    <div class="table-container glass-panel">
      <div class="table-header">
        <h2 class="table-title neon-text">
          <mat-icon>list_alt</mat-icon>
          Danh Sách Sản Lượng
        </h2>

        <div class="table-actions">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Tìm kiếm...</mat-label>
            <input matInput (keyup)="onSearchChange($event)" placeholder="Nhân viên, Lệnh SX, Mã hàng..." #searchInput>
            <mat-icon matSuffix class="neon-icon">search</mat-icon>
          </mat-form-field>

          <button mat-button class="btn-clear" (click)="openConfirmClearAll()"
                  *ngIf="dataSource.data.length > 0 && canManage()">
            <mat-icon>delete_sweep</mat-icon>
            Xóa hết
          </button>

          <button mat-raised-button class="btn-export" (click)="exportToExcel()">
            <mat-icon>download</mat-icon>
            Xuất Excel
          </button>
        </div>
      </div>

      <div class="loading-overlay" *ngIf="isLoading">
        <div class="loader"></div>
      </div>

      <div class="table-responsive">
        <table mat-table [dataSource]="dataSource" matSort>

          <ng-container matColumnDef="ngaySanXuat">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Ngày</th>
            <td mat-cell *matCellDef="let row">{{row.ngaySanXuat | date:'dd/MM/yyyy'}}</td>
          </ng-container>

          <ng-container matColumnDef="tenNhanVien">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Nhân viên</th>
            <td mat-cell *matCellDef="let row">{{row.tenNhanVien}}</td>
          </ng-container>

          <ng-container matColumnDef="lenhSanXuat">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Lệnh SX</th>
            <td mat-cell *matCellDef="let row">
              <span class="badge neon-bg">{{row.lenhSanXuat}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="maHang">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Mã hàng</th>
            <td mat-cell *matCellDef="let row">{{row.maHang}}</td>
          </ng-container>

          <ng-container matColumnDef="tenHang">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Tên hàng</th>
            <td mat-cell *matCellDef="let row">{{row.tenHang || '—'}}</td>
          </ng-container>

          <ng-container matColumnDef="nguyenVatLieu">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Nguyên Vật Liệu</th>
            <td mat-cell *matCellDef="let row">{{row.nguyenVatLieu || '—'}}</td>
          </ng-container>

          <ng-container matColumnDef="congDoan">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Công đoạn</th>
            <td mat-cell *matCellDef="let row">{{row.congDoan}}</td>
          </ng-container>

          <ng-container matColumnDef="tenMay">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Tên máy</th>
            <td mat-cell *matCellDef="let row">{{row.tenMay}}</td>
          </ng-container>

          <ng-container matColumnDef="sanLuongOK">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>SL OK</th>
            <td mat-cell *matCellDef="let row" class="text-right neon-text-ok">{{row.sanLuongOK | number}}</td>
          </ng-container>

          <ng-container matColumnDef="sanLuongLoi">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Lỗi</th>
            <td mat-cell *matCellDef="let row" class="text-right text-danger">{{row.sanLuongLoi | number}}</td>
          </ng-container>

          <ng-container matColumnDef="thoiGianBatDau">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Bắt đầu</th>
            <td mat-cell *matCellDef="let row">{{row.thoiGianBatDau | date:'HH:mm'}}</td>
          </ng-container>

          <ng-container matColumnDef="thoiGianKetThuc">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Kết thúc</th>
            <td mat-cell *matCellDef="let row">{{row.thoiGianKetThuc | date:'HH:mm'}}</td>
          </ng-container>

          <ng-container matColumnDef="thoiGianSanXuat">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Phút</th>
            <td mat-cell *matCellDef="let row" class="text-right">{{row.thoiGianSanXuat}}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Thao tác</th>
            <td mat-cell *matCellDef="let row">
              <div class="action-btns" *ngIf="canManage()">
                <button mat-icon-button class="btn-edit" matTooltip="Sửa" (click)="openEdit(row)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="btn-delete" matTooltip="Xóa" (click)="openConfirmDelete(row)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
              <span *ngIf="!canManage()" class="no-access">—</span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="ag-row"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-data-cell" colspan="14">
              <mat-icon>search_off</mat-icon>
              Không tìm thấy dữ liệu với "{{searchInput.value}}"
            </td>
          </tr>
        </table>
      </div>

      <mat-paginator 
        [length]="totalRecords"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        [pageSizeOptions]="[10, 25, 50, 100]" 
        (page)="onPageChange($event)"
        aria-label="Chọn trang">
      </mat-paginator>
    </div>

    <!-- ─── CONFIRM DELETE SINGLE ─── -->
    <div class="overlay" *ngIf="confirmDeleteRow" (click)="cancelConfirm()">
      <div class="confirm-card glass-panel" (click)="$event.stopPropagation()">
        <mat-icon class="confirm-icon warn">delete_forever</mat-icon>
        <h3>Xác nhận xóa</h3>
        <p>Xóa bản ghi của <strong>{{ confirmDeleteRow.tenNhanVien }}</strong><br>
          ngày <strong>{{ confirmDeleteRow.ngaySanXuat | date:'dd/MM/yyyy' }}</strong>?</p>
        <div class="confirm-btns">
          <button mat-button (click)="cancelConfirm()">Hủy</button>
          <button mat-raised-button class="btn-confirm-delete" (click)="doDelete()">
            <mat-icon>delete</mat-icon> Xóa
          </button>
        </div>
      </div>
    </div>

    <!-- ─── CONFIRM CLEAR ALL ─── -->
    <div class="overlay" *ngIf="showConfirmClearAll" (click)="cancelConfirm()">
      <div class="confirm-card glass-panel" (click)="$event.stopPropagation()">
        <mat-icon class="confirm-icon warn">delete_sweep</mat-icon>
        <h3>Xóa toàn bộ dữ liệu</h3>
        <p>Hành động này sẽ xóa <strong>{{ dataSource.data.length }} bản ghi</strong> và không thể hoàn tác!</p>
        <div class="confirm-btns">
          <button mat-button (click)="cancelConfirm()">Hủy</button>
          <button mat-raised-button class="btn-confirm-delete" (click)="doClearAll()">
            <mat-icon>delete_sweep</mat-icon> Xóa tất cả
          </button>
        </div>
      </div>
    </div>

    <!-- ─── EDIT DIALOG ─── -->
    <div class="overlay" *ngIf="editRecord" (click)="cancelEdit()">
      <div class="edit-card glass-panel" (click)="$event.stopPropagation()">
        <div class="edit-header">
          <h3><mat-icon>edit</mat-icon> Sửa Bản Ghi Sản Lượng</h3>
          <button mat-icon-button (click)="cancelEdit()"><mat-icon>close</mat-icon></button>
        </div>

        <div class="edit-grid" *ngIf="editRecord">
          <mat-form-field appearance="outline">
            <mat-label>Nhân Viên</mat-label>
            <mat-select [(ngModel)]="editRecord.tenNhanVien">
              <mat-option *ngFor="let nv of nhanVienOptions" [value]="nv">{{nv}}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Ngày Sản Xuất</mat-label>
            <input matInput type="date" [(ngModel)]="editRecord.ngaySanXuat">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Lệnh Sản Xuất</mat-label>
            <input matInput [(ngModel)]="editRecord.lenhSanXuat">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mã Hàng</mat-label>
            <input matInput [(ngModel)]="editRecord.maHang">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tên Hàng</mat-label>
            <input matInput [(ngModel)]="editRecord.tenHang">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nguyên Vật Liệu</mat-label>
            <input matInput [(ngModel)]="editRecord.nguyenVatLieu">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Công Đoạn</mat-label>
            <mat-select [(ngModel)]="editRecord.congDoan">
              <mat-option *ngFor="let c of (prodService.stages$ | async)" [value]="c">{{c}}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tên Máy</mat-label>
            <mat-select [(ngModel)]="editRecord.tenMay">
              <mat-option *ngFor="let m of mayOptions" [value]="m">{{m}}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Sản Lượng OK</mat-label>
            <input matInput type="number" [(ngModel)]="editRecord.sanLuongOK" min="0">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Sản Lượng Lỗi</mat-label>
            <input matInput type="number" [(ngModel)]="editRecord.sanLuongLoi" min="0">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Ghi Chú</mat-label>
            <input matInput [(ngModel)]="editRecord.ghiChu">
          </mat-form-field>
        </div>

        <div class="edit-actions">
          <button mat-button (click)="cancelEdit()">Hủy</button>
          <button mat-raised-button class="btn-save-edit" (click)="saveEdit()">
            <mat-icon>save</mat-icon> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      padding: 30px;
      border: 1px solid var(--ag-border) !important;
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }
    .table-title {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      font-size: 1.5rem;
    }
    .neon-text { color: var(--ag-text-primary); text-shadow: 0 0 10px var(--ag-neon-glow); }
    .neon-icon { color: var(--ag-neon); }
    .table-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-grow: 1;
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .search-field { max-width: 360px; width: 100%; }
    .table-responsive { overflow-x: auto; margin-bottom: 20px; border-radius: 12px; }
    table { width: 100%; background: transparent !important; }
    :host ::ng-deep .mat-mdc-table { background: transparent !important; }
    :host ::ng-deep .mat-mdc-header-row { background: transparent !important; }
    :host ::ng-deep .mat-mdc-row { background: transparent !important; }
    :host ::ng-deep .mat-mdc-cell { color: var(--ag-text-primary) !important; background: transparent !important; }
    :host ::ng-deep .mat-mdc-header-cell { color: var(--ag-text-secondary) !important; background: rgba(255,255,255,0.03) !important; }
    :host ::ng-deep .mat-mdc-no-data-row { color: var(--ag-text-secondary) !important; }
    :host ::ng-deep .mat-mdc-paginator { background: transparent !important; color: var(--ag-text-secondary) !important; }
    th.mat-header-cell {
      background-color: rgba(255,255,255,0.03) !important;
      font-weight: 700;
      color: var(--ag-text-secondary) !important;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 0.75rem;
      border-bottom: 1px solid var(--ag-border) !important;
    }
    td.mat-cell { color: var(--ag-text-primary) !important; border-bottom: 1px solid var(--ag-border) !important; }
    .ag-row:hover { background: var(--ag-neon-glow) !important; }
    .text-right { text-align: right; }
    .neon-text-ok { color: var(--ag-neon); font-weight: 700; }
    .text-danger { color: #ef4444; font-weight: 700; }
    .badge.neon-bg {
      background: rgba(14,165,233,0.15);
      color: var(--ag-neon);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid var(--ag-border);
    }
    .btn-export {
      background: linear-gradient(135deg, var(--ag-neon) 0%, #0369a1 100%) !important;
      color: white !important;
      padding: 0 24px !important;
    }
    .btn-clear { color: #ef4444 !important; }
    .action-btns { display: flex; }
    .btn-edit { color: var(--ag-neon) !important; }
    .btn-delete { color: #ef4444 !important; }
    .no-access { color: var(--ag-text-secondary); }
    .no-data-cell {
      align-items: center;
      gap: 8px;
    }

    .loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(13,17,23,0.5);
      backdrop-filter: blur(2px);
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
    }
    .loader {
      width: 40px;
      height: 40px;
      border: 4px solid var(--ag-border);
      border-top-color: var(--ag-neon);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Overlay / Confirm / Edit dialogs */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(6px);
    }
    .confirm-card {
      padding: 36px 40px;
      max-width: 420px;
      width: 90%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      text-align: center;
    }
    .confirm-icon { font-size: 48px; width: 48px; height: 48px; }
    .confirm-icon.warn { color: #ef4444; }
    .confirm-card h3 { font-size: 1.3rem; font-weight: 800; color: var(--ag-text-primary); margin: 0; }
    .confirm-card p { color: var(--ag-text-secondary); margin: 0; line-height: 1.6; }
    .confirm-card p strong { color: var(--ag-text-primary); }
    .confirm-btns { display: flex; gap: 12px; margin-top: 8px; }
    .btn-confirm-delete {
      background: linear-gradient(135deg, #ef4444, #b91c1c) !important;
      color: white !important;
      font-weight: 600 !important;
    }

    /* Edit dialog */
    .edit-card {
      padding: 28px 32px;
      max-width: 680px;
      width: 95%;
      max-height: 88vh;
      overflow-y: auto;
    }
    .edit-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .edit-header h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      font-size: 1.2rem;
      color: var(--ag-text-primary);
      margin: 0;
    }
    .edit-header h3 mat-icon { color: var(--ag-neon); }
    .edit-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media (max-width: 560px) { .edit-grid { grid-template-columns: 1fr; } }
    @media (max-width: 768px) {
      .table-container { padding: 16px; border-radius: 0 !important; }
      .table-header { flex-direction: column; align-items: stretch; gap: 12px; }
      .search-field { max-width: none; }
      .table-actions { flex-direction: column; align-items: stretch; }
      .table-title { font-size: 1.2rem; justify-content: center; }
      .confirm-card, .edit-card { width: 95% !important; padding: 24px 20px !important; }
      .edit-grid { grid-template-columns: 1fr !important; }
      .action-btns { justify-content: center; }
    }

    @media (max-width: 800px) {
      .table-header { flex-direction: column; align-items: flex-start; }
      .table-actions { width: 100%; justify-content: flex-start; }
    }
    @media (max-width: 480px) {
      .login-card { padding: 32px 20px; border-radius: 16px !important; width: 95%; }
      :host ::ng-deep .mat-mdc-card-title { font-size: 1.2rem !important; }
      .login-container { padding: 16px; height: auto; min-min-height: 100vh; }
    }
  `]
})
export class ProductionTableComponent implements OnInit, AfterViewInit {
  public prodService = inject(ProductionService);
  public authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = [
    'ngaySanXuat', 'tenNhanVien', 'lenhSanXuat', 'maHang', 'tenHang', 'nguyenVatLieu',
    'congDoan', 'tenMay', 'sanLuongOK', 'sanLuongLoi', 'thoiGianBatDau',
    'thoiGianKetThuc', 'thoiGianSanXuat', 'actions'
  ];

  dataSource = new MatTableDataSource<ProductionRecord>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Pagination state
  totalRecords = 0;
  pageSize = 25;
  pageIndex = 0;
  searchTerm = '';
  isLoading = false;

  // Options
  congDoanOptions = CONG_DOAN_OPTIONS;
  nhanVienOptions = NHAN_VIEN_OPTIONS;
  mayOptions = MAY_OPTIONS;

  // Confirm delete single
  confirmDeleteRow: ProductionRecord | null = null;
  // Confirm clear all
  showConfirmClearAll = false;
  // Edit record (deep copy)
  editRecord: ProductionRecord | null = null;

  canManage(): boolean {
    return this.authService.isManager();
  }

  ngOnInit() {
    this.isLoading = true;
    
    this.prodService.records$.subscribe(data => {
      this.dataSource.data = data;
      this.isLoading = false;
    });

    this.prodService.totalRecords$.subscribe(total => {
      this.totalRecords = total;
    });

    // Initial load
    this.loadData();
  }

  ngAfterViewInit() {
    // We handle sorting and pagination manually via API
    this.sort.sortChange.subscribe(() => {
      this.pageIndex = 0;
      this.loadData();
    });
  }

  loadData() {
    this.isLoading = true;
    this.prodService.loadRecords(this.pageIndex, this.pageSize, this.searchTerm);
  }

  onPageChange(event: any) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  private searchTimeout: any;
  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchTerm = value;
      this.pageIndex = 0;
      this.loadData();
    }, 400);
  }

  applyFilter(event: Event) {
    // Compatibility with existing calls, though onSearchChange is preferred
    this.onSearchChange(event);
  }

  // ─── Confirm dialogs (no native confirm()) ───────────────────────────────────

  openConfirmDelete(row: ProductionRecord): void {
    this.confirmDeleteRow = row;
    this.showConfirmClearAll = false;
    this.editRecord = null;
  }

  openConfirmClearAll(): void {
    this.showConfirmClearAll = true;
    this.confirmDeleteRow = null;
    this.editRecord = null;
  }

  cancelConfirm(): void {
    this.confirmDeleteRow = null;
    this.showConfirmClearAll = false;
  }

  doDelete(): void {
    if (!this.confirmDeleteRow) return;
    this.prodService.deleteRecord(this.confirmDeleteRow.id);
    this.snackBar.open('Đã xóa bản ghi.', 'Đóng', { duration: 2000 });
    this.confirmDeleteRow = null;
  }

  doClearAll(): void {
    this.prodService.clearAll();
    this.snackBar.open('✅ Đã xóa toàn bộ dữ liệu!', 'Đóng', { duration: 2500 });
    this.showConfirmClearAll = false;
  }

  // ─── Edit dialog ─────────────────────────────────────────────────────────────

  openEdit(row: ProductionRecord): void {
    // Deep copy so we don't mutate the original until save
    this.editRecord = { ...row };
    this.confirmDeleteRow = null;
    this.showConfirmClearAll = false;
  }

  cancelEdit(): void {
    this.editRecord = null;
  }

  saveEdit(): void {
    if (!this.editRecord) return;
    this.prodService.updateRecord(this.editRecord);
    this.snackBar.open('✅ Đã cập nhật bản ghi!', 'Đóng', { duration: 2500 });
    this.editRecord = null;
  }

  // ─── Export ──────────────────────────────────────────────────────────────────

  exportToExcel() {
    const exportData = this.dataSource.data.map(r => ({
      'Ngày': new Date(r.ngaySanXuat).toLocaleDateString('vi-VN'),
      'Nhân Viên': r.tenNhanVien,
      'Lệnh SX': r.lenhSanXuat,
      'Mã Hàng': r.maHang,
      'Tên Hàng': r.tenHang || '',
      'Nguyên Vật Liệu': r.nguyenVatLieu || '',
      'Công Đoạn': r.congDoan,
      'Tên Máy': r.tenMay,
      'Sản Lượng OK': r.sanLuongOK,
      'Sản Lượng Lỗi': r.sanLuongLoi,
      'Bắt Đầu': r.thoiGianBatDau ? new Date(r.thoiGianBatDau).toLocaleString('vi-VN') : '',
      'Kết Thúc': r.thoiGianKetThuc ? new Date(r.thoiGianKetThuc).toLocaleString('vi-VN') : '',
      'Tổng Phút': r.thoiGianSanXuat,
      'Ghi Chú': r.ghiChu
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      {wch:12},{wch:22},{wch:15},{wch:15},{wch:25},{wch:25},{wch:15},{wch:22},
      {wch:14},{wch:14},{wch:16},{wch:16},{wch:10},{wch:30}
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SanLuong');
    XLSX.writeFile(wb, `SanLuong_ThoIn_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
}

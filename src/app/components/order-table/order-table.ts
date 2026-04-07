import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OrderService, OrderImportPreviewRow } from '../../services/order.service';
import { OrderRecord } from '../../models/order.model';
import { OrderFormComponent } from '../order-form/order-form';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-order-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  template: `
    <div class="order-container glass-panel">
      <div class="table-header">
        <h2 class="table-title neon-text">
          <mat-icon>inventory_2</mat-icon>
          Dữ Liệu Đơn Hàng
        </h2>

        <div class="table-actions">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Tìm kiếm đơn hàng...</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="Mã hàng, Khách hàng..." #input>
            <mat-icon matSuffix class="neon-icon">search</mat-icon>
          </mat-form-field>

          <input type="file" #fileInput style="display:none" (change)="onFileSelected($event)" accept=".xlsx,.xls">

          <button mat-raised-button class="btn-add" (click)="addOrder()">
            <mat-icon>add</mat-icon>
            Thêm Mới
          </button>

          <button mat-stroked-button class="btn-import" (click)="fileInput.click()" matTooltip="Import từ Excel (.xlsx, .xls)">
            <mat-icon>upload_file</mat-icon>
            Import Excel
          </button>

          <button mat-button class="btn-clear" (click)="showClearConfirm = true"
                  *ngIf="dataSource.data.length > 0 && authService.isAdmin()">
            <mat-icon>delete_forever</mat-icon>
            Xóa hết
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table mat-table [dataSource]="dataSource" matSort>

          <ng-container matColumnDef="lenhSanXuat">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Lệnh SX</th>
            <td mat-cell *matCellDef="let row">
              <span class="badge-lsx neon-bg">{{row.lenhSanXuat || '—'}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="ngayXuong">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Ngày xuống</th>
            <td mat-cell *matCellDef="let row">{{row.ngayXuong}}</td>
          </ng-container>

          <ng-container matColumnDef="ngayGiao">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Ngày giao</th>
            <td mat-cell *matCellDef="let row">{{row.ngayGiao}}</td>
          </ng-container>

          <ng-container matColumnDef="maHang">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Mã Hàng</th>
            <td mat-cell *matCellDef="let row">
              <span class="ma-hang neon-text-ma">{{row.maHang}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="khachHang">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Khách Hàng</th>
            <td mat-cell *matCellDef="let row">{{row.khachHang}}</td>
          </ng-container>

          <ng-container matColumnDef="tenHang">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Tên Hàng</th>
            <td mat-cell *matCellDef="let row">{{row.tenHang}}</td>
          </ng-container>

          <ng-container matColumnDef="dvt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>ĐVT</th>
            <td mat-cell *matCellDef="let row">{{row.dvt}}</td>
          </ng-container>

          <ng-container matColumnDef="nguyenVatLieu">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Nguyên Vật Liệu</th>
            <td mat-cell *matCellDef="let row">{{row.nguyenVatLieu}}</td>
          </ng-container>

          <ng-container matColumnDef="rong">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Rộng</th>
            <td mat-cell *matCellDef="let row" class="text-right">{{row.rong}}</td>
          </ng-container>

          <ng-container matColumnDef="dai">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Dài</th>
            <td mat-cell *matCellDef="let row" class="text-right">{{row.dai}}</td>
          </ng-container>

          <ng-container matColumnDef="kc">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>KC (mm)</th>
            <td mat-cell *matCellDef="let row" class="text-right">{{row.kc}}</td>
          </ng-container>

          <ng-container matColumnDef="soLuong">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Số Lượng</th>
            <td mat-cell *matCellDef="let row" class="text-right neon-text-sl">{{row.soLuong | number}}</td>
          </ng-container>

          <ng-container matColumnDef="khoGiay">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Khổ Giấy</th>
            <td mat-cell *matCellDef="let row">{{row.khoGiay}}</td>
          </ng-container>

          <ng-container matColumnDef="haoPhi">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Số Mét Hao Phí</th>
            <td mat-cell *matCellDef="let row" class="text-right">{{row.haoPhi}}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Thao tác</th>
            <td mat-cell *matCellDef="let row; let i = index">
              <button mat-icon-button class="btn-delete" matTooltip="Xóa"
                      (click)="pendingDeleteIndex = i; showDeleteConfirm = true"
                      *ngIf="authService.isAdmin()">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="ag-row"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-data" colspan="15">
              <mat-icon>inventory_2</mat-icon>
              Không có dữ liệu. Nhấn "Import Excel" để bắt đầu.
            </td>
          </tr>
        </table>
      </div>

      <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" aria-label="Chọn trang"></mat-paginator>
    </div>

    <!-- ── CONFIRM DELETE SINGLE ── -->
    <div class="overlay" *ngIf="showDeleteConfirm" (click)="showDeleteConfirm=false">
      <div class="confirm-card glass-panel" (click)="$event.stopPropagation()">
        <mat-icon class="confirm-icon">delete</mat-icon>
        <h3>Xóa đơn hàng?</h3>
        <p>Hành động này không thể hoàn tác.</p>
        <div class="confirm-btns">
          <button mat-button (click)="showDeleteConfirm=false">Hủy</button>
          <button mat-raised-button class="btn-confirm-del" (click)="doDelete()">
            <mat-icon>delete</mat-icon> Xóa
          </button>
        </div>
      </div>
    </div>

    <!-- ── CONFIRM CLEAR ALL ── -->
    <div class="overlay" *ngIf="showClearConfirm" (click)="showClearConfirm=false">
      <div class="confirm-card glass-panel" (click)="$event.stopPropagation()">
        <mat-icon class="confirm-icon">delete_sweep</mat-icon>
        <h3>Xóa toàn bộ {{ dataSource.data.length }} đơn hàng?</h3>
        <p>Hành động này không thể hoàn tác!</p>
        <div class="confirm-btns">
          <button mat-button (click)="showClearConfirm=false">Hủy</button>
          <button mat-raised-button class="btn-confirm-del" (click)="doClearAll()">
            <mat-icon>delete_sweep</mat-icon> Xóa tất cả
          </button>
        </div>
      </div>
    </div>

    <!-- ── IMPORT PREVIEW DIALOG ── -->
    <div class="overlay" *ngIf="showPreview" (click)="closePreview()">
      <div class="preview-card glass-panel" (click)="$event.stopPropagation()">
        <div class="preview-header">
          <h3><mat-icon>upload_file</mat-icon> Xem Trước Import Đơn Hàng</h3>
          <button mat-icon-button (click)="closePreview()"><mat-icon>close</mat-icon></button>
        </div>

        <!-- Summary chips -->
        <div class="preview-summary">
          <span class="chip green">
            <mat-icon>check_circle</mat-icon>
            {{ newCount }} đơn hàng mới
          </span>
          <span class="chip orange" *ngIf="dupCount > 0">
            <mat-icon>warning</mat-icon>
            {{ dupCount }} trùng (bỏ qua)
          </span>
        </div>

        <div class="preview-table-wrap">
          <table class="preview-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lệnh SX</th>
                <th>Mã Hàng</th>
                <th>Tên Hàng</th>
                <th>Khách Hàng</th>
                <th>Số Lượng</th>
                <th>Ngày Giao</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of previewRows; let i = index"
                  [class.row-dup]="row.status === 'duplicate'">
                <td>{{ i + 1 }}</td>
                <td><span class="badge-lsx neon-bg">{{ row.data.lenhSanXuat || '—' }}</span></td>
                <td class="neon-text-ma">{{ row.data.maHang }}</td>
                <td>{{ row.data.tenHang }}</td>
                <td>{{ row.data.khachHang }}</td>
                <td class="text-right">{{ row.data.soLuong | number }}</td>
                <td>{{ row.data.ngayGiao }}</td>
                <td>
                  <span class="p-status" [class.new]="row.status==='new'" [class.dup]="row.status==='duplicate'">
                    <mat-icon>{{ row.status === 'new' ? 'add_circle' : 'warning' }}</mat-icon>
                    {{ row.status === 'new' ? 'Thêm mới' : 'Trùng' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="preview-actions">
          <button mat-button (click)="closePreview()">Hủy</button>
          <button mat-raised-button class="btn-confirm-import" (click)="confirmImport()"
                  [disabled]="newCount === 0">
            <mat-icon>save</mat-icon>
            Import {{ newCount }} Đơn Hàng
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .order-container { padding: 30px; border: 1px solid var(--ag-border) !important; }
    .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
    .table-title { margin: 0; display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 1.5rem; }
    .neon-text { color: var(--ag-text-primary); text-shadow: 0 0 10px var(--ag-neon-glow); }
    .neon-icon { color: var(--ag-neon); }
    .table-actions { display: flex; align-items: center; gap: 12px; flex-grow: 1; justify-content: flex-end; flex-wrap: wrap; }
    .search-field { max-width: 360px; width: 100%; }
    .table-responsive { overflow-x: auto; margin-bottom: 20px; border-radius: 12px; }
    table { width: 100%; background: transparent !important; }
    :host ::ng-deep .mat-mdc-table { background: transparent !important; }
    :host ::ng-deep .mat-mdc-header-row, :host ::ng-deep .mat-mdc-row { background: transparent !important; }
    :host ::ng-deep .mat-mdc-cell { color: var(--ag-text-primary) !important; background: transparent !important; }
    :host ::ng-deep .mat-mdc-header-cell { color: var(--ag-text-secondary) !important; background: rgba(255,255,255,0.03) !important; }
    :host ::ng-deep .mat-mdc-paginator { background: transparent !important; color: var(--ag-text-secondary) !important; }
    th.mat-header-cell { background: rgba(255,255,255,0.03) !important; font-weight:700; color: var(--ag-text-secondary)!important; text-transform: uppercase; letter-spacing:1px; font-size:0.75rem; border-bottom:1px solid var(--ag-border)!important; }
    td.mat-cell { color: var(--ag-text-primary)!important; border-bottom:1px solid var(--ag-border)!important; }
    .ag-row:hover { background: var(--ag-neon-glow) !important; }
    .text-right { text-align: right; }
    .ma-hang.neon-text-ma { color: var(--ag-neon); font-weight: 700; }
    .neon-text-ma { color: var(--ag-neon); font-weight: 700; }
    .neon-text-sl { font-weight: 700; }
    .badge-lsx.neon-bg { background: rgba(14,165,233,.15); color: var(--ag-neon); padding: 3px 9px; border-radius:6px; font-size:.8rem; font-weight:600; border:1px solid var(--ag-border); font-family:monospace; }
    .btn-add { background: linear-gradient(135deg, var(--ag-neon), #0369a1)!important; color:white!important; white-space:nowrap; }
    .btn-import { color: #22c55e!important; border-color: rgba(34,197,94,.4)!important; white-space:nowrap; }
    .btn-import:hover { background: rgba(34,197,94,.08)!important; }
    .btn-clear { color:#ef4444!important; white-space:nowrap; }
    .btn-delete { color:#ef4444!important; }
    .no-data { text-align:center; padding:40px 0!important; display:flex; flex-direction:column; align-items:center; gap:8px; color:var(--ag-text-secondary); }

    /* Overlays */
    .overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(6px); }
    .confirm-card { padding:36px 40px; max-width:420px; width:90%; display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; }
    .confirm-icon { font-size:48px; width:48px; height:48px; color:#ef4444; }
    .confirm-card h3 { font-size:1.25rem; font-weight:800; color:var(--ag-text-primary); margin:0; }
    .confirm-card p { color:var(--ag-text-secondary); margin:0; }
    .confirm-btns { display:flex; gap:12px; margin-top:8px; }
    .btn-confirm-del { background:linear-gradient(135deg,#ef4444,#b91c1c)!important; color:white!important; font-weight:600!important; }

    /* Preview dialog */
    :host ::ng-deep .preview-card {
      padding: 24px !important;
      max-width: 1000px !important;
      width: 95% !important;
      height: calc(100vh - 150px) !important;
      display: grid !important;
      grid-template-rows: auto auto 1fr auto !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
      gap: 0 !important;
    }
    :host ::ng-deep .preview-header { margin-bottom: 16px !important; flex: none !important; }
    :host ::ng-deep .preview-summary { margin-bottom: 16px !important; flex: none !important; }
    :host ::ng-deep .preview-table-wrap { 
      min-height: 0 !important;
      overflow: auto !important; 
      border-radius: 8px !important; 
      border: 1px solid var(--ag-border) !important; 
      background: rgba(0,0,0,0.05) !important;
    }
    :host ::ng-deep .preview-actions { 
      padding-top: 20px !important;
      margin-top: 10px !important;
      border-top: 1px solid var(--ag-border) !important;
      display: flex !important; 
      justify-content: flex-end !important;
      gap: 12px !important; 
      flex: none !important;
    }
    .preview-table { width:100%; border-collapse:collapse; font-size:.85rem; }
    .preview-table thead tr { background:rgba(255,255,255,.04); position: sticky; top: 0; z-index: 10; }
    .preview-table th { padding:9px 12px; text-align:left; color:var(--ag-text-secondary); font-size:.7rem; text-transform:uppercase; letter-spacing:1px; font-weight:700; border-bottom:1px solid var(--ag-border); }
    .preview-table td { padding:9px 12px; color:var(--ag-text-primary); border-bottom:1px solid var(--ag-border); }
    .preview-table tr:last-child td { border-bottom:none; }
    .row-dup { opacity:.5; }
    .p-status { display:inline-flex; align-items:center; gap:4px; font-size:.8rem; font-weight:600; }
    .p-status mat-icon { font-size:14px; width:14px; height:14px; }
    .p-status.new { color:#22c55e; }
    .p-status.dup { color:#f59e0b; }
    .btn-confirm-import { background:linear-gradient(135deg,var(--ag-neon),#0369a1)!important; color:white!important; font-weight:600!important; }

    @media (max-width: 768px) {
      .table-container { padding: 16px; border-radius: 0 !important; }
      .table-header { flex-direction: column; align-items: stretch; gap: 12px; }
      .table-actions { flex-direction: column; align-items: stretch; width: 100%; gap: 12px; }
      .table-title { font-size: 1.2rem; justify-content: center; }
      .confirm-card, .preview-card { width: 95% !important; padding: 24px 20px !important; }
    }
  `]
})
export class OrderTableComponent implements OnInit, AfterViewInit {
  private orderService = inject(OrderService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);

  displayedColumns: string[] = [
    'lenhSanXuat', 'ngayXuong', 'ngayGiao', 'maHang', 'khachHang',
    'tenHang', 'dvt', 'nguyenVatLieu', 'rong', 'dai', 'kc',
    'soLuong', 'khoGiay', 'haoPhi', 'actions'
  ];
  dataSource = new MatTableDataSource<OrderRecord>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Confirm dialogs
  showDeleteConfirm = false;
  showClearConfirm = false;
  pendingDeleteIndex = -1;

  // Import preview
  showPreview = false;
  previewRows: OrderImportPreviewRow[] = [];
  get newCount() { return this.previewRows.filter(r => r.status === 'new').length; }
  get dupCount() { return this.previewRows.filter(r => r.status === 'duplicate').length; }

  ngOnInit() {
    this.orderService.orders$.subscribe(data => {
      this.dataSource.data = data;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  addOrder() {
    this.dialog.open(OrderFormComponent, { width: '700px', disableClose: true })
      .afterClosed().subscribe(result => {
        if (result) this.snackBar.open('Đã thêm đơn hàng mới!', 'Đóng', { duration: 3000 });
      });
  }

  // ── Import flow ────────────────────────────────────────────────────────────

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    this.orderService.parseExcel(file).then(rows => {
      if (rows.length === 0) {
        this.snackBar.open('⚠️ File trống hoặc không tìm thấy cột hợp lệ!', 'Đóng', { duration: 5000 });
        return;
      }
      this.previewRows = rows;
      this.showPreview = true;
    }).catch(err => {
      console.error(err);
      this.snackBar.open('❌ Lỗi đọc file Excel!', 'Đóng', { duration: 4000 });
    });
  }

  closePreview() { this.showPreview = false; }

  confirmImport() {
    const toImport = this.previewRows.filter(r => r.status === 'new').map(r => r.data);
    this.orderService.appendRecords(toImport);
    this.closePreview();
    this.snackBar.open(`✅ Đã import ${toImport.length} đơn hàng!`, 'Đóng', { duration: 4000 });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  doDelete() {
    if (this.pendingDeleteIndex >= 0) {
      this.orderService.deleteOrder(this.pendingDeleteIndex);
      this.snackBar.open('Đã xóa đơn hàng.', 'Đóng', { duration: 2000 });
    }
    this.showDeleteConfirm = false;
    this.pendingDeleteIndex = -1;
  }

  doClearAll() {
    this.orderService.clearAll();
    this.showClearConfirm = false;
    this.snackBar.open('✅ Đã xóa toàn bộ đơn hàng!', 'Đóng', { duration: 3000 });
  }
}

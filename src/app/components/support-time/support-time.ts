import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { SupportTimeService } from '../../services/support-time.service';
import { AuthService } from '../../services/auth.service';
import { SupportTimeRecord } from '../../models/support-time.model';

@Component({
  selector: 'app-support-time',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="support-layout">

      <!-- FORM ĐĂNG KÝ (cho Staff) -->
      <div class="form-container glass-panel" *ngIf="!isManager()">
        <h2 class="form-title">
          <mat-icon>schedule</mat-icon>
          Đăng Ký Thời Gian Hỗ Trợ
        </h2>
        <form [formGroup]="supportForm" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Ngày bắt đầu</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate">
              <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Giờ bắt đầu (HH:mm)</mat-label>
              <input matInput type="time" formControlName="startTime">
              <mat-icon matSuffix class="neon-icon">access_time</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Ngày kết thúc</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate">
              <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Giờ kết thúc (HH:mm)</mat-label>
              <input matInput type="time" formControlName="endTime">
              <mat-icon matSuffix class="neon-icon">access_time</mat-icon>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Lý do / Mô tả công việc hỗ trợ</mat-label>
            <textarea matInput formControlName="reason" rows="3" placeholder="Mô tả công việc cần hỗ trợ..."></textarea>
          </mat-form-field>

          <div class="form-actions">
            <button mat-button type="button" (click)="supportForm.reset()" class="btn-cancel">Hủy</button>
            <button mat-raised-button type="submit" [disabled]="supportForm.invalid" class="btn-submit">
              <mat-icon>send</mat-icon>
              Gửi Đăng Ký
            </button>
          </div>
        </form>
      </div>

      <!-- BẢNG ĐĂNG KÝ CỦA TÔI (Staff) hoặc TẤT CẢ (Manager/Admin) -->
      <div class="table-container glass-panel">
        <div class="table-header">
          <h2 class="table-title">
            <mat-icon>list_alt</mat-icon>
            {{ isManager() ? 'Quản Lý Đăng Ký Hỗ Trợ' : 'Lịch Sử Đăng Ký Của Tôi' }}
          </h2>
          <div class="pending-badge" *ngIf="isManager() && pendingCount > 0">
            <mat-icon>notifications_active</mat-icon>
            {{ pendingCount }} chờ phê duyệt
          </div>
        </div>

        <div class="table-responsive">
          <table mat-table [dataSource]="filteredRecords">

            <ng-container matColumnDef="stt">
              <th mat-header-cell *matHeaderCellDef>#</th>
              <td mat-cell *matCellDef="let row; let i = index">{{ i + 1 }}</td>
            </ng-container>

            <ng-container matColumnDef="userName" *ngIf="isManager()">
              <th mat-header-cell *matHeaderCellDef>Nhân viên</th>
              <td mat-cell *matCellDef="let row">
                <span class="user-chip">{{ row.userName }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="startDate">
              <th mat-header-cell *matHeaderCellDef>Bắt đầu</th>
              <td mat-cell *matCellDef="let row">
                <span class="date-time">
                  <span class="date">{{ formatDate(row.startDate) }}</span>
                  <span class="time">{{ row.startTime }}</span>
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="endDate">
              <th mat-header-cell *matHeaderCellDef>Kết thúc</th>
              <td mat-cell *matCellDef="let row">
                <span class="date-time">
                  <span class="date">{{ formatDate(row.endDate) }}</span>
                  <span class="time">{{ row.endTime }}</span>
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="reason">
              <th mat-header-cell *matHeaderCellDef>Lý do</th>
              <td mat-cell *matCellDef="let row">
                <span class="reason-text" [matTooltip]="row.reason">{{ row.reason | slice:0:40 }}{{ row.reason.length > 40 ? '...' : '' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-badge" [ngClass]="'status-' + row.status">
                  <mat-icon>{{ getStatusIcon(row.status) }}</mat-icon>
                  {{ getStatusLabel(row.status) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Ngày gửi</th>
              <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'dd/MM HH:mm' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Thao tác</th>
              <td mat-cell *matCellDef="let row">
                <!-- Manager actions -->
                <ng-container *ngIf="isManager() && row.status === 'pending'">
                  <button mat-icon-button class="btn-approve" (click)="approve(row)" matTooltip="Phê duyệt">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                  <button mat-icon-button class="btn-reject" (click)="openRejectDialog(row)" matTooltip="Từ chối">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </ng-container>
                <!-- Staff delete pending -->
                <button mat-icon-button class="btn-delete" (click)="delete(row)"
                        *ngIf="!isManager() && row.status === 'pending'"
                        matTooltip="Hủy đăng ký">
                  <mat-icon>delete</mat-icon>
                </button>
                <span *ngIf="row.status !== 'pending' && !isManager()" class="no-action">—</span>
                <span *ngIf="isManager() && row.status !== 'pending'" class="reviewed-by">
                  ✓ {{ row.reviewedBy }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="ag-row"
                [class.row-pending]="row.status === 'pending'"
                [class.row-approved]="row.status === 'approved'"
                [class.row-rejected]="row.status === 'rejected'">
            </tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell empty-row" colspan="8">
                <mat-icon>inbox</mat-icon>
                <span>Chưa có đăng ký nào</span>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Reject Dialog (inline) -->
      <div class="reject-overlay" *ngIf="showRejectDialog" (click)="closeRejectDialog()">
        <div class="reject-card glass-panel" (click)="$event.stopPropagation()">
          <h3><mat-icon>cancel</mat-icon> Từ chối đăng ký</h3>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Lý do từ chối</mat-label>
            <textarea matInput [(ngModel)]="rejectReason" [ngModelOptions]="{standalone: true}" rows="3"></textarea>
          </mat-form-field>
          <div class="reject-actions">
            <button mat-button (click)="closeRejectDialog()" class="btn-cancel">Hủy</button>
            <button mat-raised-button (click)="confirmReject()" class="btn-reject-confirm">
              <mat-icon>cancel</mat-icon> Từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .support-layout {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .form-container, .table-container {
      padding: 28px;
    }
    .form-title, .table-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 1.3rem;
      color: var(--ag-text-primary);
      margin: 0 0 24px 0;
      text-shadow: 0 0 10px var(--ag-neon-glow);
    }
    .form-title mat-icon, .table-title mat-icon { color: var(--ag-neon); }
    .neon-icon { color: var(--ag-neon); }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .full-width { width: 100%; }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }
    .btn-submit {
      background: linear-gradient(135deg, var(--ag-neon) 0%, #0369a1 100%) !important;
      color: white !important;
      font-weight: 600 !important;
    }
    .btn-submit:hover { box-shadow: 0 0 15px var(--ag-neon-glow) !important; }
    .btn-cancel { color: var(--ag-text-secondary) !important; }

    /* Table */
    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .table-title { margin: 0; }
    .pending-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid #f59e0b;
      color: #f59e0b;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .table-responsive { overflow-x: auto; }
    table { width: 100%; }
    :host ::ng-deep .mat-mdc-table { background: transparent !important; }
    :host ::ng-deep .mat-mdc-row { background: transparent !important; }
    :host ::ng-deep .mat-mdc-header-row { background: transparent !important; }
    :host ::ng-deep .mat-mdc-cell { background: transparent !important; color: var(--ag-text-primary) !important; }
    :host ::ng-deep .mat-mdc-header-cell { color: var(--ag-text-secondary) !important; background: rgba(255,255,255,0.03) !important; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }

    .ag-row { transition: background 0.2s; }
    .row-pending:hover { background: rgba(245, 158, 11, 0.05) !important; }
    .row-approved:hover { background: rgba(34, 197, 94, 0.05) !important; }
    .row-rejected:hover { background: rgba(239, 68, 68, 0.05) !important; }

    /* Status badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .status-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .status-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .status-approved { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .status-rejected { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }

    .date-time { display: flex; flex-direction: column; gap: 2px; }
    .date { font-weight: 600; font-size: 0.9rem; }
    .time { font-size: 0.8rem; color: var(--ag-neon); }
    .reason-text { font-size: 0.9rem; }
    .user-chip {
      background: rgba(14, 165, 233, 0.1);
      color: var(--ag-neon);
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .reviewed-by { font-size: 0.8rem; color: var(--ag-text-secondary); }
    .no-action { color: var(--ag-text-secondary); }
    .btn-approve { color: #22c55e !important; }
    .btn-reject, .btn-delete { color: #ef4444 !important; }

    .empty-row {
      text-align: center;
      padding: 40px !important;
      color: var(--ag-text-secondary);
    }
    :host ::ng-deep .mat-mdc-no-data-row td {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px !important;
      color: var(--ag-text-secondary) !important;
    }

    /* Reject dialog */
    .reject-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    .reject-card {
      padding: 32px;
      max-width: 480px;
      width: 90%;
    }
    .reject-card h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 1.2rem;
      color: #ef4444;
      margin: 0 0 20px 0;
    }
    .reject-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }
    .btn-reject-confirm {
      background: #ef4444 !important;
      color: white !important;
      font-weight: 600 !important;
    }
  `]
})
export class SupportTimeComponent implements OnInit {
  private supportTimeService = inject(SupportTimeService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  filteredRecords: SupportTimeRecord[] = [];
  pendingCount = 0;

  showRejectDialog = false;
  rejectReason = '';
  selectedRecord: SupportTimeRecord | null = null;

  supportForm: FormGroup = this.fb.group({
    startDate: [new Date(), Validators.required],
    startTime: ['08:00', Validators.required],
    endDate: [new Date(), Validators.required],
    endTime: ['17:00', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(10)]]
  });

  get displayedColumns(): string[] {
    const base = ['stt'];
    if (this.isManager()) base.push('userName');
    return [...base, 'startDate', 'endDate', 'reason', 'status', 'createdAt', 'actions'];
  }

  isManager(): boolean {
    const role = this.authService.currentUser?.role;
    return role === 'manager' || role === 'admin';
  }

  ngOnInit(): void {
    this.supportTimeService.records$.subscribe(records => {
      const currentUser = this.authService.currentUser;
      if (this.isManager()) {
        this.filteredRecords = records;
      } else {
        this.filteredRecords = records.filter(r => r.userId === currentUser?.username);
      }
      this.pendingCount = records.filter(r => r.status === 'pending').length;
    });
  }

  onSubmit(): void {
    if (this.supportForm.valid) {
      const val = this.supportForm.value;
      const user = this.authService.currentUser!;

      const formatDate = (d: Date) => {
        if (!(d instanceof Date)) return d;
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      };

      this.supportTimeService.addRecord({
        userId: user.username,
        userName: user.displayName,
        startDate: formatDate(val.startDate),
        startTime: val.startTime,
        endDate: formatDate(val.endDate),
        endTime: val.endTime,
        reason: val.reason
      });

      this.snackBar.open('✅ Đăng ký đã gửi! Đang chờ quản lý phê duyệt.', 'Đóng', {
        duration: 4000, horizontalPosition: 'end', verticalPosition: 'top'
      });
      this.supportForm.reset({
        startDate: new Date(), startTime: '08:00',
        endDate: new Date(), endTime: '17:00', reason: ''
      });
    }
  }

  approve(record: SupportTimeRecord): void {
    this.supportTimeService.approve(record.id, this.authService.currentUser!.displayName);
    this.snackBar.open('✅ Đã phê duyệt!', 'Đóng', { duration: 2000 });
  }

  openRejectDialog(record: SupportTimeRecord): void {
    this.selectedRecord = record;
    this.rejectReason = '';
    this.showRejectDialog = true;
  }

  closeRejectDialog(): void {
    this.showRejectDialog = false;
    this.selectedRecord = null;
  }

  confirmReject(): void {
    if (this.selectedRecord && this.rejectReason.trim()) {
      this.supportTimeService.reject(
        this.selectedRecord.id,
        this.authService.currentUser!.displayName,
        this.rejectReason
      );
      this.snackBar.open('❌ Đã từ chối đăng ký.', 'Đóng', { duration: 2000 });
      this.closeRejectDialog();
    }
  }

  delete(record: SupportTimeRecord): void {
    if (confirm('Bạn có chắc muốn hủy đăng ký này?')) {
      this.supportTimeService.delete(record.id);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  getStatusLabel(status: string): string {
    return { pending: 'Chờ phê duyệt', approved: 'Đã phê duyệt', rejected: 'Từ chối' }[status] ?? status;
  }

  getStatusIcon(status: string): string {
    return { pending: 'hourglass_empty', approved: 'check_circle', rejected: 'cancel' }[status] ?? 'help';
  }
}

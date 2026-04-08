import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmployeeService } from '../../services/employee.service';
import { ProductionService } from '../../services/production.service';
import { OrderService } from '../../services/order.service';
import { SupportTimeService } from '../../services/support-time.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-data-migration',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatSnackBarModule],
  template: `
    <div class="migration-banner glass-panel" *ngIf="hasLocalData && !migrationComplete">
      <div class="banner-content">
        <mat-icon class="warn-icon">cloud_upload</mat-icon>
        <div class="text">
          <h3>Phát hiện dữ liệu cũ trên trình duyệt</h3>
          <p>Bạn có dữ liệu lưu cục bộ trên máy này. Hãy đồng bộ hóa lên máy chủ để có thể xem được trên các thiết bị khác.</p>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="migrate()" [disabled]="migrating">
            <mat-icon>{{ migrating ? 'sync' : 'cloud_done' }}</mat-icon>
            {{ migrating ? 'Đang đồng bộ...' : 'Đồng bộ lên Cloud' }}
          </button>
          <button mat-button (click)="dismiss()" [disabled]="migrating">Để sau</button>
        </div>
      </div>
      <mat-progress-bar mode="indeterminate" *ngIf="migrating"></mat-progress-bar>
    </div>
  `,
  styles: [`
    .migration-banner {
      margin: 20px 24px;
      padding: 0;
      overflow: hidden;
      border: 1px solid var(--ag-neon) !important;
      background: rgba(14, 165, 233, 0.1) !important;
    }
    .banner-content {
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .warn-icon { font-size: 32px; width: 32px; height: 32px; color: var(--ag-neon); }
    .text { flex: 1; }
    .text h3 { margin: 0 0 4px 0; font-size: 1.1rem; color: var(--ag-text-primary); font-weight: 700; }
    .text p { margin: 0; font-size: 0.9rem; color: var(--ag-text-secondary); }
    .actions { display: flex; gap: 12px; }
    @media (max-width: 768px) {
      .banner-content { flex-direction: column; text-align: center; }
      .actions { width: 100%; justify-content: center; }
    }
  `]
})
export class DataMigrationComponent implements OnInit {
  private empService = inject(EmployeeService);
  private prodService = inject(ProductionService);
  private orderService = inject(OrderService);
  private supportService = inject(SupportTimeService);
  private snackBar = inject(MatSnackBar);

  hasLocalData = false;
  migrating = false;
  migrationComplete = false;

  ngOnInit() {
    this.checkLocalData();
  }

  checkLocalData() {
    const keys = ['nhathane_employees', 'nhathane_production_records', 'nhathane_orders', 'support_time_records'];
    this.hasLocalData = keys.some(k => {
      const val = localStorage.getItem(k);
      return val && JSON.parse(val).length > 0;
    });
  }

  migrate() {
    this.migrating = true;
    
    const empData = JSON.parse(localStorage.getItem('nhathane_employees') || '[]');
    const prodData = JSON.parse(localStorage.getItem('nhathane_production_records') || '[]');
    const orderData = JSON.parse(localStorage.getItem('nhathane_orders') || '[]');
    const supportData = JSON.parse(localStorage.getItem('support_time_records') || '[]');

    const tasks = [];

    if (empData.length) tasks.push(this.empService.addBatch(empData));
    if (prodData.length) {
      // Production records might need sequential upload or batch if supported
      prodData.forEach((r: any) => tasks.push(this.prodService.addRecord(r)));
    }
    if (orderData.length) tasks.push(this.orderService.addOrder(orderData)); // Backend supports array
    
    if (tasks.length === 0) {
       this.migrating = false;
       this.hasLocalData = false;
       return;
    }

    forkJoin(tasks).subscribe({
      next: () => {
        this.snackBar.open('✅ Đồng bộ dữ liệu thành công!', 'Đóng', { duration: 5000 });
        this.clearLocal();
        this.migrationComplete = true;
        this.migrating = false;
        // Refresh all services
        this.empService.refresh();
        this.prodService.refresh();
        this.orderService.refresh();
        this.supportService.refresh();
      },
      error: (err) => {
        console.error('Migration error:', err);
        this.snackBar.open('❌ Lỗi khi đồng bộ dữ liệu. Vui lòng thử lại sau.', 'Đóng', { duration: 5000 });
        this.migrating = false;
      }
    });
  }

  dismiss() {
    this.hasLocalData = false;
  }

  private clearLocal() {
    const keys = ['nhathane_employees', 'nhathane_production_records', 'nhathane_orders', 'support_time_records', 'support_notifications', 'nhathane_stages'];
    keys.forEach(k => localStorage.removeItem(k));
  }
}

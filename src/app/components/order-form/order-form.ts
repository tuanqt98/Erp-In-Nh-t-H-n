import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title neon-text">
      <mat-icon>add_shopping_cart</mat-icon>
      Thêm Mới Đơn Hàng
    </h2>
    <mat-dialog-content>
      <form [formGroup]="orderForm" class="order-form">
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Ngày xuống</mat-label>
            <input matInput [matDatepicker]="px" formControlName="ngayXuong">
            <mat-datepicker-toggle matIconSuffix [for]="px"></mat-datepicker-toggle>
            <mat-datepicker #px></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Ngày giao</mat-label>
            <input matInput [matDatepicker]="pg" formControlName="ngayGiao">
            <mat-datepicker-toggle matIconSuffix [for]="pg"></mat-datepicker-toggle>
            <mat-datepicker #pg></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mã hàng</mat-label>
            <input matInput formControlName="maHang" placeholder="MÃ HÀNG MỚI">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Khách hàng</mat-label>
            <input matInput formControlName="khachHang">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tên hàng</mat-label>
            <input matInput formControlName="tenHang">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>ĐVT</mat-label>
            <input matInput formControlName="dvt" placeholder="Cái, Cuộn...">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nguyên vật liệu</mat-label>
            <input matInput formControlName="nguyenVatLieu">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Rộng</mat-label>
            <input matInput formControlName="rong">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Dài</mat-label>
            <input matInput formControlName="dai">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>KC (mm)</mat-label>
            <input matInput formControlName="kc">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Số lượng</mat-label>
            <input matInput type="number" formControlName="soLuong">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Khổ giấy</mat-label>
            <input matInput formControlName="khoGiay">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Hao phí</mat-label>
            <input matInput formControlName="haoPhi">
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="dialogRef.close()" class="btn-cancel">Hủy</button>
      <button mat-raised-button [disabled]="orderForm.invalid" (click)="onSubmit()" class="btn-save shadow-neon">
        <mat-icon>save</mat-icon>
        Lưu Đơn Hàng
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      font-size: 1.5rem;
      padding-top: 10px;
    }
    .neon-text {
      color: var(--ag-text-primary);
      text-shadow: 0 0 10px var(--ag-neon-glow);
    }
    .order-form { padding-top: 10px; }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      min-width: 600px;
    }
    .dialog-actions {
      padding: 16px 24px;
    }
    .btn-save {
      background: linear-gradient(135deg, var(--ag-neon) 0%, #0369a1 100%) !important;
      color: white !important;
      font-weight: 600 !important;
    }
    .shadow-neon:hover {
      box-shadow: 0 0 15px var(--ag-neon-glow) !important;
    }
    .btn-cancel { color: var(--ag-text-secondary) !important; }
    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; min-width: auto; }
    }
    mat-form-field { width: 100%; }
    :host ::ng-deep .mat-datepicker-toggle {
      color: var(--ag-neon) !important;
    }
  `]
})
export class OrderFormComponent {
  private fb = inject(FormBuilder);
  private orderService = inject(OrderService);
  dialogRef = inject(MatDialogRef<OrderFormComponent>);

  orderForm: FormGroup = this.fb.group({
    stt: [''], // Will be calculated if needed or left blank
    ngayXuong: [new Date(), Validators.required],
    ngayGiao: [new Date(), Validators.required],
    maHang: ['', Validators.required],
    khachHang: ['', Validators.required],
    tenHang: ['', Validators.required],
    dvt: ['Cái'],
    nguyenVatLieu: [''],
    rong: [''],
    dai: [''],
    kc: [''],
    soLuong: [0, [Validators.required, Validators.min(0)]],
    khoGiay: [''],
    haoPhi: ['']
  });

  onSubmit() {
    if (this.orderForm.valid) {
      const val = this.orderForm.value;
      
      // Format dates to dd/MM/yyyy
      const formatDate = (d: any) => {
        if (!(d instanceof Date)) return d;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      };

      const record = {
        ...val,
        ngayXuong: formatDate(val.ngayXuong),
        ngayGiao: formatDate(val.ngayGiao),
        stt: val.stt || (this.orderService.orders.length + 1)
      };

      this.orderService.addOrder(record);
      this.dialogRef.close(true);
    }
  }
}

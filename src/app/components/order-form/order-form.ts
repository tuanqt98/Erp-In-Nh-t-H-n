import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TextFieldModule } from '@angular/cdk/text-field';
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
    MatIconModule,
    TextFieldModule
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
            <mat-label>Lệnh sản xuất</mat-label>
            <input matInput formControlName="lenhSanXuat" placeholder="Nhập mã lệnh...">
            <mat-icon matSuffix style="color: var(--ag-neon)">tag</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Ngày giao</mat-label>
            <input matInput [matDatepicker]="pg" formControlName="ngayGiao">
            <mat-datepicker-toggle matIconSuffix [for]="pg"></mat-datepicker-toggle>
            <mat-datepicker #pg></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Sản phẩm</mat-label>
            <textarea matInput 
                      formControlName="tenHang" 
                      placeholder="Nhập mã và tên sản phẩm..."
                      cdkTextareaAutosize
                      [cdkAutosizeMinRows]="1"
                      [cdkAutosizeMaxRows]="4"
                      class="product-textarea"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Số lượng</mat-label>
            <input matInput type="number" formControlName="soLuong">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>ĐVT</mat-label>
            <input matInput formControlName="dvt" placeholder="Cái, Cuộn...">
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
      gap: 16px;
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
      .dialog-title { font-size: 1.2rem; }
      .dialog-actions { flex-direction: column; gap: 8px; padding: 12px 16px; }
      .dialog-actions button { width: 100%; }
    }
    mat-form-field { width: 100%; }
    .product-textarea {
      resize: none;
      line-height: 1.4;
    }
    :host ::ng-deep .mat-datepicker-toggle {
      color: var(--ag-neon) !important;
    }
  `]
})
export class OrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private orderService = inject(OrderService);
  dialogRef = inject(MatDialogRef<OrderFormComponent>);

  orderForm: FormGroup = this.fb.group({
    lenhSanXuat: ['', Validators.required],
    ngayGiao: [new Date(), Validators.required],
    maHang: ['', Validators.required],
    tenHang: ['', Validators.required],
    soLuong: [0, [Validators.required, Validators.min(0)]],
    dvt: ['Cái'],
    // Hidden defaults
    ngayXuong: [''],
    khachHang: [''],
    nguyenVatLieu: [''],
    rong: [''],
    dai: [''],
    kc: [''],
    khoGiay: [''],
    haoPhi: ['']
  });

  ngOnInit() {
    // Auto-generate next Lệnh SX number
    const orders = this.orderService.orders;
    let maxNum = 0;
    for (const o of orders) {
      const lsx = o.lenhSanXuat || '';
      // Extract number from end of string (e.g., "LSX-9000" → 9000, "9000" → 9000)
      const match = lsx.match(/(\d+)\s*$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const nextNum = maxNum + 1;
    // Preserve prefix if exists (e.g., "LSX-"), otherwise just number
    let prefix = '';
    if (orders.length > 0) {
      const lastLsx = orders[orders.length - 1]?.lenhSanXuat || '';
      const prefixMatch = lastLsx.match(/^(.*?)(\d+)\s*$/);
      if (prefixMatch && prefixMatch[1]) {
        prefix = prefixMatch[1];
      }
    }
    this.orderForm.patchValue({
      lenhSanXuat: prefix + String(nextNum)
    });
  }

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
        maHang: val.tenHang,
        ngayGiao: formatDate(val.ngayGiao),
        ngayXuong: formatDate(new Date())
      };

      this.orderService.addOrder(record);
      this.dialogRef.close(true);
    }
  }
}

import { Component, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductionService } from '../../services/production.service';
import { OrderService } from '../../services/order.service';
import { CONG_DOAN_OPTIONS, MAY_OPTIONS, NHAN_VIEN_OPTIONS } from '../../models/production.model';

@Component({
  selector: 'app-production-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="form-container glass-panel">
      <h2 class="form-title neon-text">
        <mat-icon>add_circle</mat-icon>
        Nhập Sản Lượng Mới
      </h2>

      <form [formGroup]="prodForm" (ngSubmit)="onSubmit()" class="production-form">
        <div class="form-grid">
          <!-- Ngày sản xuất -->
          <mat-form-field appearance="outline">
            <mat-label>Ngày sản xuất</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="ngaySanXuat" #firstInput>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <!-- Tên nhân viên with Autocomplete -->
          <mat-form-field appearance="outline">
            <mat-label>Tên nhân viên</mat-label>
            <input type="text"
                   placeholder="Mã NV hoặc Tên NV..."
                   matInput
                   formControlName="tenNhanVien"
                   [matAutocomplete]="autoNV">
            <mat-autocomplete #autoNV="matAutocomplete">
              <mat-option *ngFor="let name of filteredNhanVienOptions | async" [value]="name">
                {{name}}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>

          <!-- Lệnh sản xuất with Autocomplete from Orders -->
          <mat-form-field appearance="outline">
            <mat-label>Lệnh sản xuất (LSX)</mat-label>
            <input type="text"
                   matInput
                   formControlName="lenhSanXuat"
                   placeholder="Nhập hoặc chọn LSX..."
                   [matAutocomplete]="autoLSX">
            <mat-autocomplete #autoLSX="matAutocomplete">
              <mat-option *ngFor="let opt of filteredLsxOptions | async" [value]="opt">
                {{opt}}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>

          <!-- Mã hàng with Autocomplete from Orders -->
          <mat-form-field appearance="outline">
            <mat-label>Mã hàng</mat-label>
            <input type="text"
                   placeholder="Nhập mã hàng..."
                   matInput
                   formControlName="maHang"
                   [matAutocomplete]="autoMH">
            <mat-autocomplete #autoMH="matAutocomplete">
              <mat-option *ngFor="let opt of filteredMaHangOptions | async" [value]="opt">
                {{opt}}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>

          <!-- Tên hàng (Auto-filled) -->
          <mat-form-field appearance="outline">
            <mat-label>Tên hàng</mat-label>
            <input matInput formControlName="tenHang" placeholder="Tự động điền khi nhập LSX...">
          </mat-form-field>

          <!-- Nguyên Vật Liệu (Auto-filled) -->
          <mat-form-field appearance="outline">
            <mat-label>Nguyên Vật Liệu</mat-label>
            <input matInput formControlName="nguyenVatLieu" placeholder="Tự động điền khi nhập LSX...">
          </mat-form-field>

          <!-- Công đoạn -->
          <div class="stage-container">
            <!-- Normal Select Mode -->
            <ng-container *ngIf="!showAddStageInput">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Công đoạn</mat-label>
                <mat-select formControlName="congDoan">
                  <mat-option *ngFor="let opt of (prodService.stages$ | async)" [value]="opt">{{ opt }}</mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-icon-button type="button" class="btn-toggle-add" (click)="showAddStageInput = true" matTooltip="Thêm công đoạn mới">
                <mat-icon>add_box</mat-icon>
              </button>
            </ng-container>

            <!-- Inline Add Mode -->
            <ng-container *ngIf="showAddStageInput">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Tên công đoạn mới</mat-label>
                <input matInput [(ngModel)]="newStageName" [ngModelOptions]="{standalone: true}" placeholder="Nhập tên..." (keyup.enter)="saveNewStage()">
              </mat-form-field>
              <div class="inline-actions">
                <button mat-icon-button type="button" class="btn-check" (click)="saveNewStage()" [disabled]="!newStageName.trim()">
                  <mat-icon>check_circle</mat-icon>
                </button>
                <button mat-icon-button type="button" class="btn-cancel-small" (click)="cancelAddStage()">
                  <mat-icon>cancel</mat-icon>
                </button>
              </div>
            </ng-container>
          </div>

          <!-- Tên máy with Autocomplete -->
          <mat-form-field appearance="outline">
            <mat-label>Tên máy</mat-label>
            <input type="text"
                   placeholder="Gõ để tìm máy..."
                   aria-label="Tên máy"
                   matInput
                   formControlName="tenMay"
                   [matAutocomplete]="autoMachine">
            <mat-autocomplete #autoMachine="matAutocomplete">
              <mat-option *ngFor="let m of filteredMayOptions | async" [value]="m">
                {{m}}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>

          <!-- Sản lượng OK -->
          <mat-form-field appearance="outline">
            <mat-label>Sản lượng OK</mat-label>
            <input matInput type="number" formControlName="sanLuongOK">
          </mat-form-field>

          <!-- Sản lượng lỗi -->
          <mat-form-field appearance="outline">
            <mat-label>Sản lượng lỗi</mat-label>
            <input matInput type="number" formControlName="sanLuongLoi">
          </mat-form-field>

          <!-- Thời gian Bắt đầu -->
          <div class="datetime-group">
            <mat-form-field appearance="outline" class="date-field">
              <mat-label>Ngày bắt đầu</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate">
              <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline" class="time-field">
              <mat-label>Giờ bắt đầu</mat-label>
              <input matInput [matTimepicker]="startTimePicker" formControlName="startTime">
              <mat-timepicker-toggle matIconSuffix [for]="startTimePicker"></mat-timepicker-toggle>
              <mat-timepicker #startTimePicker></mat-timepicker>
            </mat-form-field>
          </div>

          <!-- Thời gian Kết thúc -->
          <div class="datetime-group">
            <mat-form-field appearance="outline" class="date-field">
              <mat-label>Ngày kết thúc</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate">
              <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline" class="time-field">
              <mat-label>Giờ kết thúc</mat-label>
              <input matInput [matTimepicker]="endTimePicker" formControlName="endTime">
              <mat-timepicker-toggle matIconSuffix [for]="endTimePicker"></mat-timepicker-toggle>
              <mat-timepicker #endTimePicker></mat-timepicker>
            </mat-form-field>
          </div>

          <!-- Tổng thời gian (Tự động) -->
          <div class="duration-display">
            <mat-icon>timer</mat-icon>
            <div class="info">
              <span class="label">Tổng thời gian</span>
              <span class="value">{{ prodForm.get('thoiGianSanXuat')?.value || 0 }} phút</span>
            </div>
          </div>
        </div>

        <!-- Ghi chú -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ghi chú</mat-label>
          <textarea matInput formControlName="ghiChu" rows="2"></textarea>
        </mat-form-field>

        <div class="actions">
          <button mat-button type="button" (click)="onReset()" class="btn-cancel">Hủy</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="prodForm.invalid" class="btn-save">
            <mat-icon>save</mat-icon>
            Lưu Dữ Liệu
          </button>
        </div>
      </form>
    </div>

    <!-- ─── SAVE CONFIRMATION MODAL ─── -->
    <div class="overlay" *ngIf="showSaveConfirm" (click)="showSaveConfirm = false">
      <div class="confirm-card glass-panel" (click)="$event.stopPropagation()">
        <mat-icon class="confirm-icon neon-text">help_outline</mat-icon>
        <h3>Xác nhận lưu dữ liệu?</h3>
        <p>Bạn đang lưu sản lượng cho:<br>
          <strong>{{ prodForm.get('tenNhanVien')?.value }}</strong><br>
          Ngày: <strong>{{ prodForm.get('ngaySanXuat')?.value | date:'dd/MM/yyyy' }}</strong>
        </p>
        <div class="confirm-btns">
          <button mat-button (click)="showSaveConfirm = false">Kiểm tra lại</button>
          <button mat-raised-button class="btn-confirm-save" (click)="doConfirmSave()">
            <mat-icon>check_circle</mat-icon> Xác nhận Lưu
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      padding: 30px;
      border: 1px solid var(--ag-border) !important;
    }
    .form-title {
      margin-top: 0;
      margin-bottom: 30px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      font-size: 1.5rem;
      letter-spacing: 0.5px;
    }
    .neon-text {
      color: var(--ag-text-primary);
      text-shadow: 0 0 10px var(--ag-neon-glow);
    }
    .production-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Override for Material Icons in form */
    :host ::ng-deep .mat-datepicker-toggle, 
    :host ::ng-deep .mat-timepicker-toggle {
      color: var(--ag-neon) !important;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .datetime-group {
      display: flex;
      gap: 8px;
    }
    .date-field { flex: 2; }
    .time-field { flex: 1; }
    .full-width {
      width: 100%;
    }
    .duration-display {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px 24px;
      background: var(--ag-neon-glow) !important;
      border: 1px solid var(--ag-neon);
      border-radius: 12px;
      height: 56px;
      box-sizing: border-box;
      box-shadow: 0 0 15px var(--ag-neon-glow);
    }
    .duration-display mat-icon { color: var(--ag-neon); font-size: 24px; width: 24px; height: 24px; }
    .duration-display .info { display: flex; flex-direction: column; }
    .duration-display .label { font-size: 0.7rem; color: var(--ag-text-secondary); text-transform: uppercase; }
    .duration-display .value { font-weight: 700; color: var(--ag-text-primary); font-size: 1.1rem; }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
    }
    .btn-save {
      background: linear-gradient(135deg, var(--ag-neon) 0%, #0369a1 100%) !important;
      color: white !important;
      padding: 0 32px !important;
      font-weight: 600 !important;
      letter-spacing: 0.5px !important;
    }
    .btn-cancel {
      color: var(--ag-text-secondary) !important;
    }
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .datetime-group { flex-direction: column; gap: 0; }
      .duration-display { width: 100%; justify-content: center; margin-bottom: 8px; }
      .actions { flex-direction: column; gap: 12px; width: 100%; }
      .actions button { width: 100%; padding: 12px !important; height: 48px; }
      .form-title { font-size: 1.2rem; justify-content: center; }
    }

    .stage-container { display: flex; align-items: center; gap: 4px; min-height: 80px; }
    .flex-1 { flex: 1; }
    .btn-toggle-add { color: var(--ag-neon) !important; margin-top: -18px; }
    .inline-actions { display: flex; margin-top: -18px; }
    .btn-check { color: #10b981 !important; }
    .btn-cancel-small { color: #ef4444 !important; }
    .btn-toggle-add:hover, .btn-check:hover, .btn-cancel-small:hover { background: rgba(255,255,255,0.05) !important; }

    /* CONFIRMATION OVERLAY (reused from table) */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
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
    .confirm-card h3 { font-size: 1.3rem; font-weight: 800; color: var(--ag-text-primary); margin: 0; }
    .confirm-card p { color: var(--ag-text-secondary); margin: 0; line-height: 1.6; }
    .confirm-card p strong { color: var(--ag-text-primary); }
    .confirm-btns { display: flex; gap: 12px; margin-top: 12px; }
    .btn-confirm-save {
      background: linear-gradient(135deg, var(--ag-neon), #0369a1) !important;
      color: white !important;
      font-weight: 600 !important;
    }
  `]
})
export class ProductionFormComponent implements OnInit {
  public fb = inject(FormBuilder);
  public prodService = inject(ProductionService);
  private snackBar = inject(MatSnackBar);
  public orderService = inject(OrderService);

  @ViewChild('firstInput') firstInput!: ElementRef;

  nhanVienOptions = NHAN_VIEN_OPTIONS;
  mayOptions = MAY_OPTIONS;
  showSaveConfirm = false;
  showAddStageInput = false;
  newStageName = '';
  filteredMayOptions!: Observable<string[]>;
  filteredNhanVienOptions!: Observable<string[]>;
  filteredMaHangOptions!: Observable<string[]>;
  filteredLsxOptions!: Observable<string[]>;

  prodForm: FormGroup = this.fb.group({
    ngaySanXuat: [new Date(), Validators.required],
    tenNhanVien: ['', Validators.required],
    lenhSanXuat: ['', Validators.required],
    maHang: ['', Validators.required],
    tenHang: [''],
    nguyenVatLieu: [''],
    congDoan: ['', Validators.required],
    tenMay: ['', Validators.required],
    sanLuongOK: [0, [Validators.required, Validators.min(0)]],
    sanLuongLoi: [0, [Validators.required, Validators.min(0)]],
    startDate: [new Date(), Validators.required],
    startTime: [new Date(), Validators.required],
    endDate: [new Date(), Validators.required],
    endTime: [new Date(), Validators.required],
    thoiGianSanXuat: [0, [Validators.required, Validators.min(0)]],
    ghiChu: ['']
  });

  ngOnInit() {
    this.filteredMayOptions = this.prodForm.get('tenMay')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterMay(value || '')),
    );

    this.filteredNhanVienOptions = this.prodForm.get('tenNhanVien')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterNV(value || '')),
    );

    this.filteredMaHangOptions = this.prodForm.get('maHang')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterMaHang(value || '')),
    );

    this.filteredLsxOptions = this.prodForm.get('lenhSanXuat')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterLSX(value || '')),
    );

    // Auto-calculate duration
    this.prodForm.valueChanges.subscribe(val => {
      if (val.startDate && val.startTime && val.endDate && val.endTime) {
        const start = this._combineDateTime(val.startDate, val.startTime);
        const end = this._combineDateTime(val.endDate, val.endTime);
        if (end > start) {
          const diffMs = end.getTime() - start.getTime();
          const diffMins = Math.round(diffMs / 60000);
          this.prodForm.get('thoiGianSanXuat')!.patchValue(diffMins, { emitEvent: false });
        } else {
          this.prodForm.get('thoiGianSanXuat')!.patchValue(0, { emitEvent: false });
        }
      }
    });

    // Auto-fill fields when Lệnh SX is selected
    this.prodForm.get('lenhSanXuat')!.valueChanges.subscribe(lsx => {
      if (lsx) {
        const match = this.orderService.orders.find(o => o.lenhSanXuat === lsx);
        if (match) {
          this.prodForm.patchValue({
            maHang: match.maHang,
            tenHang: match.tenHang,
            nguyenVatLieu: match.nguyenVatLieu
          }, { emitEvent: false });
        }
      }
    });
  }

  private _combineDateTime(date: Date, time: Date): Date {
    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return combined;
  }

  private _filterLSX(value: string): string[] {
    const filterValue = value.toLowerCase();
    const orders = this.orderService.orders;
    const uniqueLSX = [...new Set(orders.map(o => o.lenhSanXuat))];
    return uniqueLSX.filter(lsx => lsx.toLowerCase().includes(filterValue));
  }

  private _filterMaHang(value: string): string[] {
    const filterValue = value.toLowerCase();
    const orders = this.orderService.orders;
    const uniqueMaHang = [...new Set(orders.map(o => o.maHang))];
    return uniqueMaHang.filter(mh => mh.toLowerCase().includes(filterValue));
  }

  private _filterMay(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.mayOptions.filter(m => m.toLowerCase().includes(filterValue));
  }

  private _filterNV(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.nhanVienOptions.filter(nv => nv.toLowerCase().includes(filterValue));
  }

  onSubmit() {
    if (this.prodForm.valid) {
      this.showSaveConfirm = true;
    }
  }

  doConfirmSave() {
    this.showSaveConfirm = false;
    const formValue = this.prodForm.value;
    
    // Convert date to string YYYY-MM-DD
    const date = formValue.ngaySanXuat as Date;
    const dateStr = date.toISOString().split('T')[0];

    const start = this._combineDateTime(formValue.startDate, formValue.startTime);
    const end = this._combineDateTime(formValue.endDate, formValue.endTime);

    this.prodService.addRecord({
      ...formValue,
      ngaySanXuat: dateStr,
      thoiGianBatDau: start.toISOString(),
      thoiGianKetThuc: end.toISOString()
    });

    this.snackBar.open('Đã lưu sản lượng thành công!', 'Đóng', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });

    this.onReset();
  }

  saveNewStage() {
    const name = this.newStageName.trim();
    if (name) {
      this.prodService.addStage(name);
      this.snackBar.open(`✅ Đã thêm công đoạn: ${name}`, 'Đóng', { duration: 2000 });
      this.prodForm.get('congDoan')!.setValue(name);
      this.cancelAddStage();
    }
  }

  cancelAddStage() {
    this.showAddStageInput = false;
    this.newStageName = '';
  }

  onReset() {
    this.prodForm.reset({
      ngaySanXuat: new Date(),
      sanLuongOK: 0,
      sanLuongLoi: 0,
      startDate: new Date(),
      startTime: new Date(),
      endDate: new Date(),
      endTime: new Date(),
      thoiGianSanXuat: 0
    });
    
    // Focus back to first input
    setTimeout(() => {
      this.firstInput.nativeElement.focus();
    }, 100);
  }
}

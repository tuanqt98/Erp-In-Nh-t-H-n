export interface Employee {
  id: string;           // Auto-generated
  maNhanVien: string;   // Employee code (also login username)
  tenNhanVien: string;
  phongBan: string;
  chucVu: string;
  email?: string;
  soDienThoai?: string;
  ngayVaoLam?: string;
  trangThai: 'active' | 'inactive';
  createdAt: string;
}

export const PHONG_BAN_OPTIONS = [
  'Cơ điện, tạp vụ',
  'Kế hoạch',
  'Kế toán - HC',
  'Kho Lái xe',
  'Kinh Doanh',
  'KTBH',
  'RD Thiết kế',
  'AKO',
  'Ca HC',
  'Chất lượng',
  'Diecut',
  'Flexo',
  'In Trạm',
  'In Trục',
  'Kho',
  'KTS tờ + cuộn',
  'Tạp vụ',
  'In KTS',
  'KD',
  'Lái xe',
];

export const CHUC_VU_OPTIONS = [
  'Công Nhân',
  'Tổ Trưởng',
  'Trưởng Phòng',
  'Phó Phòng',
  'Giám Đốc',
  'Quản Lý',
  'Nhân Viên',
  'Kỹ Thuật Viên',
];

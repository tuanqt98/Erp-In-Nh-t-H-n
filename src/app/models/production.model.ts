export interface ProductionRecord {
  id: string;
  ngaySanXuat: string;        // YYYY-MM-DD
  tenNhanVien: string;
  lenhSanXuat: string;
  maHang: string;
  tenHang: string;            // Add
  nguyenVatLieu: string;      // Add
  congDoan: string;
  tenMay: string;
  sanLuongOK: number;
  sanLuongLoi: number;
  thoiGianBatDau?: string;    // ISO string or datetime-local string
  thoiGianKetThuc?: string;   // ISO string or datetime-local string
  thoiGianSanXuat: number;    // total minutes (calculated)
  ghiChu: string;
  createdAt: number;          // timestamp
}

export const CONG_DOAN_OPTIONS = ['In', 'Cán Màng', 'Bế', 'Xén', 'Chia', 'Phủ cào', 'Chặt tờ'];

export const NHAN_VIEN_OPTIONS = [
  'NV00626 - Lê Thị Tươi', 'NV00632 - Đàm Duy Thuận', 'NV00679 - Đặng Đình Hùng', 'NV00808 - Phạm Văn Bình',
  'NV00628 - Nguyễn Quốc Tuấn', 'NV00633 - Tạ Thị Luyến', 'NV00642 - Phan Thị Yến', 'NV00653 - Đỗ Minh Phương',
  'NV00666 - Hà Văn Tuân', 'NV00685 - Nguyễn Thị Tuyết', 'NV00600 - Nguyễn Thị Liên', 'NV00610 - Hà Phương Linh',
  'NV00611 - Đỗ Thị Hạnh', 'NV00657 - Nguyễn Thị Huệ', 'NV00681 - Lê Thị Thùy An', 'NV00055 - Trịnh Thị Ánh Ngọc',
  'NV00806 - Nguyễn Thị Kim Thu', 'NV00809 - Ngô Hải Yến', 'NV00643 - Lê Minh Hoàn', 'NV00644 - Ngô Minh Khương',
  'NV00655 - Ngô Văn Khanh', 'NV00607 - Nguyễn Ngọc Châm', 'NV00617 - Trần Thị Hồng Nhung', 'NV00618 - Lê Thị Lan',
  'NV00619 - Nguyễn Thị Trình', 'NV00646 - Nguyễn Thị Lan Hương', 'NV00807 - Lê Thị Dương', 'NV00601 - Phạm Thị Tuyết',
  'NV00603 - Lê Thị Hoài Linh', 'NV00605 - Trần Thị Thanh Bình', 'NV00606 - Đặng Lê Huyền Chi', 'NV00636 - Lê Thị Thu Phương',
  'NV00683 - Tạ Thị Đào', 'NV00688 - Phạm Thị Ngọc Mai', 'NV00720 - Nguyễn Thị Trà Giang', 'NV00805 - Lê Thị Hiệp',
  'NV00621 - Lê Ngọc Văn', 'NV00622 - Nguyễn Văn Pháp', 'NV00629 - Nguyễn Đình Lanh', 'NV00630 - Phạm Quang Tiến',
  'NV00654 - Ngô Tuấn Sơn', 'NV00658 - Mai Thị Hải Trang', 'NV00005 - Nguyễn Văn Đông', 'NV00035 - Vũ Mạnh Tùng',
  'NV00048 - Lê Văn Tám', 'NV00060 - Nguyễn Văn Song', 'NV00045 - Nguyễn Đình Nam', 'NV0001 - Bùi Thị Liễu',
  'NV0004 - Mai Thị Thúy', 'NV0008 - Nguyễn Thị Phong', 'NV00019 - Đinh Văn Cường', 'NV00020 - Nguyễn Tiến Trường',
  'NV00022 - Nguyễn Thị Hằng', 'NV00023 - Nguyễn Thị Tân', 'NV00024 - Hoàng Thị Anh Thư', 'NV00026 - Nguyễn Thế Chúc',
  'NV00032 - Hà Minh Huân', 'NV00071 - Đoàn Thị Thủy', 'NV00081 - Bùi Hoàng Linh', 'NV00091 - Nguyễn Thị Huệ',
  'NV0108 - Hoàng Hải Nguồn 2', 'NV0107 - Đào Quang Linh', 'NV00119 - Linh Thị Tươi', 'NV00123 - Hà Anh Dũng',
  'NV00124 - Lương Văn Phúc', 'NV00141 - Đỗ Thị Thu Hà', 'NV00144 - Nguyễn Thị Thu Thảo', 'NV0010 - Bùi Văn Vị',
  'NV00021 - Vàng A Mạnh', 'NV00030 - Phùng Văn Thông', 'NV00068 - Nguyễn Duy Dũng', 'NV00075 - Nguyễn Văn Hoàng',
  'NV00079 - Tạ Duy Bằng', 'NV00088 - Bùi Văn Sáng', 'NV00095 - Sầm Văn Thường', 'NV00142 - Tạ Quang Thành',
  'NV0015 - Nguyễn Khắc Tiệp', 'NV0036 - Vạn Văn Nam', 'NV0037 - Nguyễn Văn Hậu', 'NV0038 - Hoàng Như Vàng',
  'NV0047 - Đỗ Xuân Dũng', 'NV0061 - Đinh Trường Sơn', 'NV0066 - Phan Văn Công', 'NV0007 - Xa Văn Quyết',
  'NV0009 - Lê Quang Quý', 'NV00013 - Hoàng Văn Lương', 'NV00050 - Nguyễn Công Toản', 'NV00052 - Nguyễn Văn Hoàng B',
  'NV00092 - Vũ Văn Tài', 'NV00087 - Bùi Văn Hậu', 'NV00034 - Đào Văn Hoàn', 'NV00046 - Dương Văn Thắng',
  'NV00089 - Hoàng Trọng Tâm', 'NV00103 - Ma Đình Quốc', 'NV00025 - Nông Văn Trương', 'NV00028 - Nguyễn Thị Liên',
  'NV0201 - Hoàng Minh Hiếu', 'NV0203 - Nguyễn Thị Năm', 'NV0204 - Nguyễn Thị Minh Hằng', 'NV0205 - Lê Xuân Quyết',
  'NV0207 - Nguyễn Văn Luân', 'NV00211 - Tạ Thị Kim Duyên', 'NV00216 - Đàm Thị Kim Dung', 'NV0006 - Phạm Quốc Phú',
  'NV0012 - Nguyễn Thị Hồng', 'NV0031 - Nguyễn Hồng Giang', 'NV00053 - Hà Quý Tự', 'NV00059 - Lã Văn Thanh',
  'NV00063 - Hoàng Văn Dũng', 'NV00085 - Nguyễn Thị Sim', 'NV00069 - Lương Thuận Anh', 'NV00990 - Đặng Thị Nga (mẹ Huệ)',
  'NV00991 - Nguyễn Thế Dũng', 'NV00241 - Nguyễn Thị Thủy', 'NV00672 - Ngô Văn Tiến'
];

export const MAY_OPTIONS = [
  'LETTERPRESS 1', 'LETTERPRESS 2', 'LETTERPRESS 3', 'LETTERPRESS 4', 'LETTERPRESS 5',
  'FLEXO 1 ( 2 MÀU )', 'FLEXO 2 ( 2 MÀU )', 'FLEXO 3 ( 5 màu )', 'FLEXO 4 ( 8 màu 350)', 'FLEXO 5 ( 8 màu - 460 )', 'FLEXO 6 ( AKO)',
  'OffSet CUỘN', 'DIGITAL 1', 'DIGITAL 2', 'KONIKA', 'FUJI',
  'PHỦ CÀO TỜ', 'MÁY PHỦ UV TỜ', 'cán màng tờ', 'MÁY CÁN MÀNG+UV', 'MÁY PHỦ CÀO CUỘN',
  'DIE-CUT 1', 'DIE-CUT 2', 'DIE-CUT 3', 'DIE-CUT 4', 'DIE-CUT 5', 'DIE-CUT 6', 'DIE-CUT 7',
  'MÁY BẾ DEMI 1', 'MÁY BẾ DEMI 2', 'MÁY BẾ DEMI 3', 'MÁY BẾ DEMI 4', 'MÁY BẾ DEMI 5', 'MÁY BẾ DEMI 6',
  'MÁY CHẶT ĐỘC LẬP 1', 'MÁY XÉN',
  'MÁY CHIA 00', 'MÁY CHIA 1', 'MÁY CHIA 2', 'MÁY CHIA 3', 'MÁY CHIA 4', 'MÁY CHIA 5', 'MÁY CHIA 6', 'MÁY CHIA 7', 'MÁY CHIA 8'
];

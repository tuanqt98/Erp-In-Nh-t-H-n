import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma';
import { setCors } from './lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET: List all production records
    if (req.method === 'GET') {
      const records = await prisma.productionRecord.findMany({
        orderBy: { createdAt: 'desc' },
        include: { employee: { select: { tenNhanVien: true, maNhanVien: true } } }
      });
      return res.status(200).json(records);
    }

    // POST: Create or batch actions
    if (req.method === 'POST') {
      const { action } = req.body || {};

      // Clear all
      if (action === 'clearAll') {
        const deleted = await prisma.productionRecord.deleteMany();
        return res.status(200).json({ deleted: deleted.count });
      }

      // Single create
      const data = req.body;
      
      // Try to look up employeeId from tenNhanVien (optional - not required)
      let employeeId = data.employeeId || null;
      if (!employeeId && data.tenNhanVien) {
        // tenNhanVien format: "NV00628 - Nguyễn Quốc Tuấn" — extract maNhanVien
        const maNV = data.tenNhanVien.split(' - ')[0]?.trim();
        if (maNV) {
          const emp = await prisma.employee.findUnique({ where: { maNhanVien: maNV } }).catch(() => null);
          employeeId = emp?.id || null;
        }
      }

      const record = await prisma.productionRecord.create({
        data: {
          ngaySanXuat: data.ngaySanXuat,
          tenNhanVien: data.tenNhanVien || '',
          employeeId: employeeId,
          lenhSanXuat: data.lenhSanXuat || '',
          maHang: data.maHang || '',
          tenHang: data.tenHang || '',
          nguyenVatLieu: data.nguyenVatLieu || null,
          congDoan: data.congDoan || '',
          tenMay: data.tenMay || '',
          sanLuongOK: Number(data.sanLuongOK) || 0,
          sanLuongLoi: Number(data.sanLuongLoi) || 0,
          thoiGianBatDau: data.thoiGianBatDau || null,
          thoiGianKetThuc: data.thoiGianKetThuc || null,
          thoiGianSanXuat: Number(data.thoiGianSanXuat) || 0,
          ghiChu: data.ghiChu || null,
        }
      });
      return res.status(201).json(record);
    }

    // PUT: Update record
    if (req.method === 'PUT') {
      const { id, ...changes } = req.body;
      const updateData: any = {};
      const fields = ['ngaySanXuat', 'tenNhanVien', 'employeeId', 'lenhSanXuat', 'maHang', 'tenHang',
        'nguyenVatLieu', 'congDoan', 'tenMay', 'ghiChu', 'thoiGianBatDau', 'thoiGianKetThuc'];
      const numFields = ['sanLuongOK', 'sanLuongLoi', 'thoiGianSanXuat'];

      for (const f of fields) {
        if (changes[f] !== undefined) updateData[f] = changes[f];
      }
      for (const f of numFields) {
        if (changes[f] !== undefined) updateData[f] = Number(changes[f]) || 0;
      }

      const record = await prisma.productionRecord.update({ where: { id }, data: updateData });
      return res.status(200).json(record);
    }

    // DELETE: Delete record
    if (req.method === 'DELETE') {
      const id = req.query['id'] as string;
      if (!id) return res.status(400).json({ message: 'id is required' });
      await prisma.productionRecord.delete({ where: { id } });
      return res.status(200).json({ message: 'Deleted' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Production API Error:', error);
    return res.status(500).json({ message: error.message });
  }
}

import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma';
import { hashPassword } from './lib/auth';
import { setCors } from './lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET: List all employees
    if (req.method === 'GET') {
      const employees = await prisma.employee.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { role: true } } }
      });
      return res.status(200).json(employees);
    }

    // POST: Create or batch actions
    if (req.method === 'POST') {
      const { action } = req.body || {};

      // Batch import
      if (action === 'batch') {
        const { items } = req.body;
        const results = [];
        for (const item of items) {
          // Skip if maNhanVien already exists
          const exists = await prisma.employee.findUnique({ where: { maNhanVien: item.maNhanVien } });
          if (exists) continue;

          const emp = await prisma.employee.create({
            data: {
              maNhanVien: item.maNhanVien,
              tenNhanVien: item.tenNhanVien,
              phongBan: item.phongBan || '',
              chucVu: item.chucVu || '',
              ngayVaoLam: item.ngayVaoLam ? new Date(item.ngayVaoLam) : null,
              trangThai: item.trangThai || 'active',
              email: item.email || null,
              soDienThoai: item.soDienThoai || null,
            }
          });
          // Create linked user account with default password
          const hashed = await hashPassword('1');
          await prisma.user.create({
            data: {
              username: emp.maNhanVien,
              password: hashed,
              displayName: emp.tenNhanVien,
              role: 'staff',
              employeeId: emp.id,
            }
          }).catch(() => {}); // Ignore if user already exists
          results.push(emp);
        }
        return res.status(200).json({ count: results.length, employees: results });
      }

      // Reset password
      if (action === 'resetPassword') {
        const { employeeId } = req.body;
        const hashed = await hashPassword('1');
        await prisma.user.updateMany({
          where: { employeeId },
          data: { password: hashed }
        });
        return res.status(200).json({ message: 'Đã reset mật khẩu về 1' });
      }

      // Set role
      if (action === 'setRole') {
        const { employeeId, role } = req.body;
        await prisma.user.updateMany({
          where: { employeeId },
          data: { role }
        });
        return res.status(200).json({ message: 'Đã cập nhật quyền' });
      }

      // Single create
      const data = req.body;
      const emp = await prisma.employee.create({
        data: {
          maNhanVien: data.maNhanVien,
          tenNhanVien: data.tenNhanVien,
          phongBan: data.phongBan || '',
          chucVu: data.chucVu || '',
          ngayVaoLam: data.ngayVaoLam ? new Date(data.ngayVaoLam) : null,
          trangThai: data.trangThai || 'active',
          email: data.email || null,
          soDienThoai: data.soDienThoai || null,
        }
      });
      // Create user account
      const hashed = await hashPassword('1');
      await prisma.user.create({
        data: {
          username: emp.maNhanVien,
          password: hashed,
          displayName: emp.tenNhanVien,
          role: 'staff',
          employeeId: emp.id,
        }
      }).catch(() => {});
      return res.status(201).json(emp);
    }

    // PUT: Update employee
    if (req.method === 'PUT') {
      const { id, ...changes } = req.body;
      const updateData: any = {};
      if (changes.tenNhanVien !== undefined) updateData.tenNhanVien = changes.tenNhanVien;
      if (changes.phongBan !== undefined) updateData.phongBan = changes.phongBan;
      if (changes.chucVu !== undefined) updateData.chucVu = changes.chucVu;
      if (changes.email !== undefined) updateData.email = changes.email;
      if (changes.soDienThoai !== undefined) updateData.soDienThoai = changes.soDienThoai;
      if (changes.trangThai !== undefined) updateData.trangThai = changes.trangThai;
      if (changes.ngayVaoLam !== undefined) updateData.ngayVaoLam = changes.ngayVaoLam ? new Date(changes.ngayVaoLam) : null;
      
      // If maNhanVien changed, also update user username
      if (changes.maNhanVien !== undefined) {
        updateData.maNhanVien = changes.maNhanVien;
        await prisma.user.updateMany({
          where: { employeeId: id },
          data: { username: changes.maNhanVien }
        });
      }

      const emp = await prisma.employee.update({ where: { id }, data: updateData });
      return res.status(200).json(emp);
    }

    // DELETE: Delete employee
    if (req.method === 'DELETE') {
      const id = req.query['id'] as string;
      if (!id) return res.status(400).json({ message: 'id is required' });
      // Delete linked user first
      await prisma.user.deleteMany({ where: { employeeId: id } });
      await prisma.employee.delete({ where: { id } });
      return res.status(200).json({ message: 'Deleted' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Employees API Error:', error);
    return res.status(500).json({ message: error.message });
  }
}

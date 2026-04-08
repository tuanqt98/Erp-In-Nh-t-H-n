import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma';
import { setCors } from './lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET: List orders with pagination and search
    if (req.method === 'GET') {
      const page = Number(req.query['page']) || 0;
      const pageSize = Number(req.query['pageSize']) || 100;
      const search = (req.query['search'] as string || '').trim().toLowerCase();

      const where: any = {};
      if (search) {
        where.OR = [
          { lenhSanXuat: { contains: search, mode: 'insensitive' } },
          { maHang: { contains: search, mode: 'insensitive' } },
          { tenHang: { contains: search, mode: 'insensitive' } },
          { khachHang: { contains: search, mode: 'insensitive' } },
          { nguyenVatLieu: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: page * pageSize,
          take: pageSize,
        }),
        prisma.order.count({ where })
      ]);

      return res.status(200).json({ orders, total });
    }

    // POST: Create order(s)
    if (req.method === 'POST') {
      const { action, items } = req.body || {};

      // Batch import
      if (action === 'batch' && Array.isArray(items)) {
        const created = await prisma.order.createMany({ data: items });
        return res.status(200).json({ count: created.count });
      }

      // Clear all
      if (action === 'clearAll') {
        const deleted = await prisma.order.deleteMany();
        return res.status(200).json({ deleted: deleted.count });
      }

      // Single create
      const data = req.body;
      const order = await prisma.order.create({
        data: {
          lenhSanXuat: data.lenhSanXuat || '',
          ngayXuong: data.ngayXuong || null,
          ngayGiao: data.ngayGiao || null,
          maHang: data.maHang || '',
          khachHang: data.khachHang || null,
          tenHang: data.tenHang || '',
          dvt: data.dvt || null,
          nguyenVatLieu: data.nguyenVatLieu || null,
          rong: data.rong?.toString() || null,
          dai: data.dai?.toString() || null,
          kc: data.kc?.toString() || null,
          soLuong: Number(data.soLuong) || 0,
          khoGiay: data.khoGiay || null,
          haoPhi: data.haoPhi?.toString() || null,
        }
      });
      return res.status(201).json(order);
    }

    // DELETE: Delete single order or all
    if (req.method === 'DELETE') {
      const id = req.query['id'] as string;
      if (id) {
        await prisma.order.delete({ where: { id } });
        return res.status(200).json({ message: 'Deleted' });
      }
      // Body action for clearAll
      if (req.body?.action === 'clearAll') {
        const deleted = await prisma.order.deleteMany();
        return res.status(200).json({ deleted: deleted.count });
      }
      return res.status(400).json({ message: 'id is required' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Orders API Error:', error);
    return res.status(500).json({ message: error.message });
  }
}

import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma';
import { setCors } from './lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET: List all records
    if (req.method === 'GET') {
      const records = await prisma.supportTime.findMany({ orderBy: { createdAt: 'desc' } });
      return res.status(200).json(records);
    }

    // POST: Create new record
    if (req.method === 'POST') {
      const data = req.body;
      const record = await prisma.supportTime.create({
        data: {
          userId: data.userId,
          userName: data.userName,
          startDate: data.startDate,
          endDate: data.endDate,
          startTime: data.startTime,
          endTime: data.endTime,
          reason: data.reason,
          status: 'pending',
        }
      });
      return res.status(201).json(record);
    }

    // PUT: Approve / Reject
    if (req.method === 'PUT') {
      const { id, action, reviewedBy, rejectReason } = req.body;
      if (!id) return res.status(400).json({ message: 'id is required' });

      if (action === 'approve') {
        const record = await prisma.supportTime.update({
          where: { id },
          data: {
            status: 'approved',
            reviewedBy,
            reviewedAt: new Date().toISOString(),
          }
        });
        return res.status(200).json(record);
      }

      if (action === 'reject') {
        const record = await prisma.supportTime.update({
          where: { id },
          data: {
            status: 'rejected',
            reviewedBy,
            reviewedAt: new Date().toISOString(),
            rejectReason: rejectReason || '',
          }
        });
        return res.status(200).json(record);
      }

      return res.status(400).json({ message: 'action must be approve or reject' });
    }

    // DELETE: Delete record
    if (req.method === 'DELETE') {
      const id = req.query['id'] as string;
      if (!id) return res.status(400).json({ message: 'id is required' });
      await prisma.supportTime.delete({ where: { id } });
      return res.status(200).json({ message: 'Deleted' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('SupportTime API Error:', error);
    return res.status(500).json({ message: error.message });
  }
}

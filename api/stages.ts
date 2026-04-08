import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma';
import { setCors } from './lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET: List all stages
    if (req.method === 'GET') {
      const stages = await prisma.productionStage.findMany({ orderBy: { name: 'asc' } });
      return res.status(200).json(stages.map(s => s.name));
    }

    // POST: Add stage
    if (req.method === 'POST') {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: 'name is required' });
      const stage = await prisma.productionStage.upsert({
        where: { name },
        update: {},
        create: { name }
      });
      return res.status(201).json(stage);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Stages API Error:', error);
    return res.status(500).json({ message: error.message });
  }
}

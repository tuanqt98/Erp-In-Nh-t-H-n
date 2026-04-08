import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userCount = await prisma.user.count();
    return res.status(200).json({ 
      status: 'OK', 
      database: 'Connected', 
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ 
      status: 'Error', 
      message: error.message, 
      code: error.code,
      stack: error.stack 
    });
  } finally {
    await prisma.$disconnect();
  }
}

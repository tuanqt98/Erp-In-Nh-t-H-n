import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    
    let userCount = 0;
    try {
      userCount = await prisma.user.count();
    } catch {
      // Tables may not exist yet
    }

    return res.status(200).json({ 
      status: 'OK', 
      database: 'Connected',
      tablesReady: userCount >= 0,
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ 
      status: 'Error', 
      message: error.message, 
      code: error.code
    });
  }
}

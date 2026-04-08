import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma';
import { signToken, comparePassword, hashPassword } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 1. HEALTH CHECK & BOOTSTRAP (GET)
    if (req.method === 'GET') {
      const userCount = await prisma.user.count();
      return res.status(200).json({ 
        status: 'OK', 
        message: 'Auth Service Active',
        isBootstrapped: userCount > 0,
        userCount 
      });
    }

    // 2. LOGIN (POST)
    if (req.method === 'POST') {
      const { username, password } = req.body;

      // Bootstrap logic: Create admin if no users exist
      const userCount = await prisma.user.count();
      if (userCount === 0 && username === 'admin' && password === '1') {
        const hashedPassword = await hashPassword('1');
        const admin = await prisma.user.create({
          data: {
            username: 'admin',
            password: hashedPassword,
            displayName: 'Quản trị viên',
            role: 'admin'
          }
        });
        
        const token = signToken({
          userId: admin.id,
          username: admin.username,
          role: admin.role
        });

        return res.status(200).json({
          token,
          user: {
            username: admin.username,
            role: admin.role,
            displayName: admin.displayName
          }
        });
      }

      // Standard Login
      const user = await prisma.user.findUnique({
        where: { username },
        include: { employee: true },
      });

      if (user && (await comparePassword(password, user.password))) {
        const token = signToken({
          userId: user.id,
          username: user.username,
          role: user.role,
          employeeId: user.employeeId || undefined,
        });

        return res.status(200).json({
          token,
          user: {
            username: user.username,
            role: user.role,
            displayName: user.displayName,
            employeeId: user.employeeId,
          },
        });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ 
      status: 'CRASH',
      message: error.message,
      hint: 'Check Prisma binaries and connection string.' 
    });
  }
}

import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma';
import { signToken, comparePassword, hashPassword } from './lib/auth';
import { setCors } from './lib/cors';

// Built-in accounts to seed when database is empty
const SEED_USERS = [
  { username: 'admin', password: '1', displayName: 'Quản Trị Viên', role: 'admin' },
  { username: 'qlsx',  password: '1', displayName: 'Quản Lý Sản Xuất', role: 'manager' },
  { username: 'staff', password: '1', displayName: 'Nhân Viên In', role: 'staff' },
];

async function bootstrapUsers() {
  const count = await prisma.user.count();
  if (count === 0) {
    for (const u of SEED_USERS) {
      const hashed = await hashPassword(u.password);
      await prisma.user.create({
        data: { username: u.username, password: hashed, displayName: u.displayName, role: u.role }
      });
    }
    // Seed default production stages
    const stages = ['In', 'Cán Màng', 'Bế', 'Xén', 'Chia', 'Phủ cào', 'Chặt tờ'];
    for (const name of stages) {
      await prisma.productionStage.upsert({
        where: { name },
        update: {},
        create: { name }
      });
    }
    return true;
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET: Health check
    if (req.method === 'GET') {
      const userCount = await prisma.user.count();
      return res.status(200).json({ 
        status: 'OK', 
        message: 'Auth Service Active',
        isBootstrapped: userCount > 0,
        userCount 
      });
    }

    // POST: Login or actions
    if (req.method === 'POST') {
      const { action, username, password, newPassword, newDisplayName } = req.body || {};

      // Bootstrap: seed users if DB is empty
      const seeded = await bootstrapUsers();
      if (seeded) {
        console.log('Bootstrapped 3 default users + stages');
      }

      // Action: Change password
      if (action === 'changePassword') {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !(await comparePassword(password, user.password))) {
          return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
        }
        const hashed = await hashPassword(newPassword);
        await prisma.user.update({ where: { username }, data: { password: hashed } });
        return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
      }

      // Action: Change display name
      if (action === 'changeDisplayName') {
        await prisma.user.update({ where: { username }, data: { displayName: newDisplayName } });
        return res.status(200).json({ message: 'Đổi tên hiển thị thành công' });
      }

      // Action: Reset password by username (admin only - resets to '1')
      if (action === 'resetPasswordByUsername') {
        const targetUsername = req.body.targetUsername;
        const hashed = await hashPassword('1');
        const result = await prisma.user.updateMany({
          where: { username: targetUsername },
          data: { password: hashed }
        });
        if (result.count === 0) {
          return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }
        return res.status(200).json({ message: `Đã reset mật khẩu của "${targetUsername}" về 1` });
      }

      // Standard Login
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
      }

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
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ 
      status: 'CRASH',
      message: error.message,
    });
  }
}

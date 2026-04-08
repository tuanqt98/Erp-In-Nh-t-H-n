import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const diagnostics: any = {
    time: new Date().toISOString(),
    env: {
      node_version: process.version,
      has_db_url: !!process.env['DATABASE_URL'],
      has_jwt_secret: !!process.env['JWT_SECRET']
    }
  };

  try {
    diagnostics.step = 'Importing Prisma...';
    const { prisma } = require('./lib/prisma');
    diagnostics.prisma_imported = true;

    diagnostics.step = 'Testing Prisma Connection...';
    const count = await prisma.user.count();
    diagnostics.db_connected = true;
    diagnostics.user_count = count;

    diagnostics.step = 'Importing Auth...';
    const auth = require('./lib/auth');
    diagnostics.auth_imported = true;

    return res.status(200).json({
      status: 'SUCCESS',
      diagnostics
    });
  } catch (error: any) {
    return res.status(200).json({
      status: 'DIAGNOSTIC_FAILURE',
      failed_at_step: diagnostics.step,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack ? error.stack.split('\n').slice(0, 5) : 'No stack'
      },
      diagnostics
    });
  }
}

import { Pool, types } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Fix for Decimal/BigInt types in pg
types.setTypeParser(1700, (val) => parseFloat(val));

// Remove channel_binding from connection string as pg Pool doesn't support it
const rawUrl = process.env['DATABASE_URL'] || '';
const connectionString = rawUrl.replace(/[&?]channel_binding=require/g, '');

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = prisma;

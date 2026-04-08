import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const client = new Client({
    connectionString: process.env['DATABASE_URL'],
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    return res.status(200).json({
      status: 'Connection Success',
      server_time: result.rows[0].now,
      database_url_obscured: process.env['DATABASE_URL']?.replace(/:([^@]+)@/, ':****@')
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'Connection Failed',
      message: error.message,
      stack: error.stack
    });
  } finally {
    await client.end();
  }
}

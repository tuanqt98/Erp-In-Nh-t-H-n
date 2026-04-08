import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'Hello World from Vercel!',
    time: new Date().toISOString(),
    env: {
      has_db_url: !!process.env['DATABASE_URL'],
      has_jwt_secret: !!process.env['JWT_SECRET']
    }
  });
}

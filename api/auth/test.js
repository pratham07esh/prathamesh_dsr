import { setCors } from '../_lib.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    message: 'Test endpoint working',
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasCosmosConnection: !!process.env.COSMOS_CONNECTION_STRING,
    nodeEnv: process.env.NODE_ENV,
  });
}

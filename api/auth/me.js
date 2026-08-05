import { verifyJwt, setCors } from '../_lib.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decoded = verifyJwt(req);
    return res.status(200).json({ success: true, user: decoded });
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Unauthorized' });
  }
}

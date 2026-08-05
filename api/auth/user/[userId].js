import { getContainer, verifyJwt, requireAdmin, findUserById, setCors } from '../../_lib.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decoded = verifyJwt(req);
    requireAdmin(decoded);

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const container = await getContainer();
    const user = await findUserById(container, userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isSystemAdmin) {
      return res.status(403).json({ message: 'Cannot delete system administrator' });
    }

    await container.item(userId).delete();

    console.log('✅ User deleted:', user.username);
    return res.status(200).json({ success: true, message: `User ${user.username} deleted` });
  } catch (error) {
    if (error.message.includes('Admin') || error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to delete user', success: false });
  }
}

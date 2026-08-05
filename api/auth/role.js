import { getContainer, verifyJwt, requireAdmin, findUserById, setCors } from '../_lib.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decoded = verifyJwt(req);
    requireAdmin(decoded);

    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ message: 'User ID and new role are required' });
    }

    if (!['user', 'admin'].includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const container = await getContainer();
    const user = await findUserById(container, userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isSystemAdmin && newRole === 'user') {
      return res.status(403).json({ message: 'Cannot demote system administrator' });
    }

    user.role = newRole;

    await container.item(userId).replace(user);

    console.log(`✅ User role changed: ${user.username} -> ${newRole}`);
    return res.status(200).json({ success: true, message: `User ${user.username} role changed to ${newRole}` });
  } catch (error) {
    if (error.message.includes('Admin') || error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to change user role', success: false });
  }
}

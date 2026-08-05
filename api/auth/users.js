import { getContainer, verifyJwt, requireAdmin, getAllUsers, setCors } from '../_lib.js';

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
    requireAdmin(decoded);

    const container = await getContainer();
    const users = await getAllUsers(container);

    const safeUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      status: u.status,
      isSystemAdmin: u.isSystemAdmin,
      permissions: u.permissions || { canAdd: false, canEdit: false, canDelete: false },
      createdAt: u.createdAt,
      approvedAt: u.approvedAt,
      approvedBy: u.approvedBy,
    }));

    return res.status(200).json({ success: true, users: safeUsers });
  } catch (error) {
    if (error.message.includes('Admin') || error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to fetch users', success: false });
  }
}

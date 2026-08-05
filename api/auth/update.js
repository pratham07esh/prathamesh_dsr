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

    const { userId, newRole, permissions } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const container = await getContainer();
    const user = await findUserById(container, userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle role change
    if (newRole) {
      if (!['user', 'admin'].includes(newRole)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      if (user.isSystemAdmin && newRole === 'user') {
        return res.status(403).json({ message: 'Cannot demote system administrator' });
      }

      user.role = newRole;
      await container.item(userId).replace(user);
      console.log(`✅ User role changed: ${user.username} -> ${newRole}`);
      return res.status(200).json({ success: true, message: `User ${user.username} role changed to ${newRole}` });
    }

    // Handle permissions change
    if (permissions) {
      if (typeof permissions.canAdd !== 'boolean' || typeof permissions.canEdit !== 'boolean' || typeof permissions.canDelete !== 'boolean') {
        return res.status(400).json({ message: 'Invalid permissions format' });
      }

      user.permissions = {
        canAdd: permissions.canAdd,
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete,
      };

      await container.item(userId).replace(user);
      console.log(`✅ User permissions updated: ${user.username}`);
      return res.status(200).json({ success: true, message: `Permissions updated for ${user.username}` });
    }

    return res.status(400).json({ message: 'newRole or permissions required' });
  } catch (error) {
    if (error.message.includes('Admin') || error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to update user', success: false });
  }
}

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

    const { userId, permissions } = req.body;

    if (!userId || !permissions) {
      return res.status(400).json({ message: 'User ID and permissions are required' });
    }

    if (typeof permissions.canAdd !== 'boolean' || typeof permissions.canEdit !== 'boolean' || typeof permissions.canDelete !== 'boolean') {
      return res.status(400).json({ message: 'Invalid permissions format' });
    }

    const container = await getContainer();
    const user = await findUserById(container, userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.permissions = {
      canAdd: permissions.canAdd,
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete,
    };

    await container.item(userId).replace(user);

    console.log(`✅ User permissions updated: ${user.username}`);
    return res.status(200).json({ success: true, message: `Permissions updated for ${user.username}` });
  } catch (error) {
    if (error.message.includes('Admin') || error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to update permissions', success: false });
  }
}

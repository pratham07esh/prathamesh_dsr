import { getContainer, verifyJwt, requireAdmin, findUserById, setCors } from '../_lib.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.query;

  try {
    const decoded = verifyJwt(req);
    requireAdmin(decoded);

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const container = await getContainer();
    const user = await findUserById(container, userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'approve') {
      user.status = 'approved';
      user.approvedAt = new Date().toISOString();
      user.approvedBy = decoded.username;
      user.permissions = {
        canAdd: false,
        canEdit: false,
        canDelete: false,
      };
      await container.item(userId).replace(user);
      console.log('✅ User approved:', user.username);
      return res.status(200).json({ success: true, message: `User ${user.username} approved` });
    }

    if (action === 'reject') {
      user.status = 'rejected';
      user.approvedBy = decoded.username;
      await container.item(userId).replace(user);
      console.log('✅ User rejected:', user.username);
      return res.status(200).json({ success: true, message: `User ${user.username} rejected` });
    }

    return res.status(400).json({ message: 'Invalid action' });
  } catch (error) {
    if (error.message.includes('Admin') || error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: `Failed to ${action} user`, success: false });
  }
}

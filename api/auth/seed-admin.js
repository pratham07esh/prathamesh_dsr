import { v4 as uuidv4 } from 'uuid';
import { getContainer, hashPassword, setCors } from '../_lib.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const container = await getContainer();
    const { resources } = await container.items
      .query(`SELECT * FROM c WHERE c.type = 'user' AND c.username = 'admin'`)
      .fetchAll();
    const existingAdmin = resources[0];

    if (existingAdmin) {
      return res.status(200).json({ message: 'Default admin already exists' });
    }

    const adminId = `user_admin_${uuidv4()}`;
    const hashedPassword = await hashPassword('admin');

    const adminUser = {
      id: adminId,
      type: 'user',
      username: 'admin',
      passwordHash: hashedPassword,
      role: 'admin',
      status: 'approved',
      isSystemAdmin: true,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'system',
    };

    await container.items.create(adminUser);

    console.log('✅ Default admin seeded successfully');
    return res.status(200).json({ message: 'Default admin created successfully', success: true });
  } catch (error) {
    console.error('Error seeding admin:', error);
    return res.status(500).json({ message: 'Failed to seed admin', success: false });
  }
}

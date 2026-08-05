import { v4 as uuidv4 } from 'uuid';
import { getContainer, hashPassword, findUserByUsername, setCors } from '../_lib.js';

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const container = await getContainer();
    const existingUser = await findUserByUsername(container, username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const userId = `user_${uuidv4()}`;
    const newUser = {
      id: userId,
      type: 'user',
      username,
      passwordHash: hashedPassword,
      role: 'user',
      status: 'pending',
      isSystemAdmin: false,
      createdAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null,
    };

    await container.items.create(newUser);

    console.log('✅ User registered successfully:', username);
    return res.status(201).json({
      message: 'Registration submitted successfully. Please wait for admin approval.',
      success: true,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Registration failed', success: false });
  }
}

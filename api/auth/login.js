import { getContainer, verifyPassword, generateToken, findUserByUsername, setCors } from '../_lib.js';

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

    const container = await getContainer();
    const user = await findUserByUsername(container, username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is awaiting admin approval.' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your registration was rejected' });
    }

    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    console.log('✅ User logged in:', user.username);
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        permissions: user.permissions || { canAdd: true, canEdit: true, canDelete: true },
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Login failed', success: false });
  }
}

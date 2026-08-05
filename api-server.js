import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { CosmosClient } from '@azure/cosmos';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const app = express();

// CORS configuration - must be first
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://dsr-two.vercel.app'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

// Cosmos DB connection
const connectionString = process.env.COSMOS_CONNECTION_STRING;

if (!connectionString) {
  console.error('❌ COSMOS_CONNECTION_STRING environment variable not set');
  process.exit(1);
}

const client = new CosmosClient({ connectionString });
const database = client.database('prathmeshcosmosdbdev');
const container = database.container('prathmeshcosmoscontainer1');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize Cosmos DB
const initCosmosDB = async () => {
  try {
    await database.read();
    console.log('✅ Connected to Cosmos DB');
  } catch (error) {
    console.error('❌ Cosmos DB connection failed:', error.message);
  }
};

initCosmosDB();

// ==================== AUTHENTICATION MIDDLEWARE ====================

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ==================== UTILITY FUNCTIONS ====================

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions || { canAdd: true, canEdit: true, canDelete: true },
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const findUserByUsername = async (username) => {
  try {
    const { resources } = await container.items
      .query({
        query: `SELECT * FROM c WHERE c.type = 'user' AND c.username = @username`,
        parameters: [{ name: '@username', value: username }]
      })
      .fetchAll();
    return resources[0] || null;
  } catch (error) {
    console.error('Error finding user by username:', error);
    return null;
  }
};


const findUserById = async (userId) => {
  try {
    const { resource } = await container.item(userId).read();
    return resource || null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
};

const getAllUsers = async () => {
  try {
    const { resources } = await container.items
      .query(`SELECT * FROM c WHERE c.type = 'user' ORDER BY c.createdAt DESC`)
      .fetchAll();
    return resources;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// ==================== AUTH ENDPOINTS ====================

// Seed default admin
app.post('/api/auth/seed-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await findUserByUsername('admin');

    if (existingAdmin) {
      return res.json({ message: 'Default admin already exists' });
    }

    // Create default admin
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
    res.json({ message: 'Default admin created successfully', success: true });
  } catch (error) {
    console.error('Error seeding admin:', error);
    res.status(500).json({ message: 'Failed to seed admin', success: false });
  }
});

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validations
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if username exists
    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
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
    res.status(201).json({
      message: 'Registration submitted successfully. Please wait for admin approval.',
      success: true,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Registration failed', success: false });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username
    const user = await findUserByUsername(username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is approved
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is awaiting admin approval.' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your registration was rejected' });
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    console.log('✅ User logged in:', user.username);
    res.json({
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
    res.status(500).json({ message: 'Login failed', success: false });
  }
});

// Admin login
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = await findUserByUsername(username);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Check if admin is approved
    if (user.status !== 'approved') {
      return res.status(403).json({ message: 'Admin account is not approved' });
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    console.log('✅ Admin logged in:', user.username);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        isSystemAdmin: user.isSystemAdmin,
        permissions: { canAdd: true, canEdit: true, canDelete: true },
      },
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Login failed', success: false });
  }
});

// Update user (role or permissions) - consolidated endpoint
app.put('/api/auth/update', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId, newRole, permissions } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await findUserById(userId);

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
      return res.json({ success: true, message: `User ${user.username} role changed to ${newRole}` });
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
      return res.json({ success: true, message: `Permissions updated for ${user.username}` });
    }

    return res.status(400).json({ message: 'newRole or permissions required' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', success: false });
  }
});

// Update user permissions (admin only) - kept for backwards compatibility
app.put('/api/auth/permissions', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId, permissions } = req.body;

    if (!userId || !permissions) {
      return res.status(400).json({ message: 'User ID and permissions are required' });
    }

    if (typeof permissions.canAdd !== 'boolean' || typeof permissions.canEdit !== 'boolean' || typeof permissions.canDelete !== 'boolean') {
      return res.status(400).json({ message: 'Invalid permissions format' });
    }

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update permissions
    user.permissions = {
      canAdd: permissions.canAdd,
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete,
    };

    await container.item(userId).replace(user);

    console.log(`✅ User permissions updated: ${user.username}`);
    res.json({ success: true, message: `Permissions updated for ${user.username}` });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    res.status(500).json({ message: 'Failed to update permissions', success: false });
  }
});

// Get all users (admin only)
app.get('/api/auth/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();

    // Remove passwordHash from response
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

    res.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', success: false });
  }
});

// Approve user (admin only)
app.put('/api/auth/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user status and set default permissions
    user.status = 'approved';
    user.approvedAt = new Date().toISOString();
    user.approvedBy = req.user.username;
    user.permissions = {
      canAdd: false,
      canEdit: false,
      canDelete: false,
    };

    await container.item(userId).replace(user);

    console.log('✅ User approved:', user.username);
    res.json({ success: true, message: `User ${user.username} approved` });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Failed to approve user', success: false });
  }
});

// Reject user (admin only)
app.put('/api/auth/reject', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user status
    user.status = 'rejected';
    user.approvedBy = req.user.username;

    await container.item(userId).replace(user);

    console.log('✅ User rejected:', user.username);
    res.json({ success: true, message: `User ${user.username} rejected` });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'Failed to reject user', success: false });
  }
});

// Change user role (admin only)
app.put('/api/auth/role', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ message: 'User ID and new role are required' });
    }

    if (!['user', 'admin'].includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent demoting system admin
    if (user.isSystemAdmin && newRole === 'user') {
      return res.status(403).json({ message: 'Cannot demote system administrator' });
    }

    // Update role
    user.role = newRole;

    await container.item(userId).replace(user);

    console.log(`✅ User role changed: ${user.username} -> ${newRole}`);
    res.json({ success: true, message: `User ${user.username} role changed to ${newRole}` });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({ message: 'Failed to change user role', success: false });
  }
});

// Delete user (admin only)
app.delete('/api/auth/user/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting system admin
    if (user.isSystemAdmin) {
      return res.status(403).json({ message: 'Cannot delete system administrator' });
    }

    await container.item(userId).delete();

    console.log('✅ User deleted:', user.username);
    res.json({ success: true, message: `User ${user.username} deleted` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', success: false });
  }
});

// Verify token
app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ==================== TRACKER ENDPOINTS (existing) ====================

// API: Save data to Cosmos DB
app.post('/api/save', async (req, res) => {
  try {
    const { entries, qaMembers } = req.body;

    // Save all data in one document
    await container.items.upsert({
      id: 'daily-tracker-data',
      type: 'tracker',
      entries,
      qaMembers,
      timestamp: new Date().toISOString(),
    });

    console.log('✅ Tracker data saved to Cosmos DB');
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Load data from Cosmos DB
app.get('/api/load', async (req, res) => {
  try {
    const { resource: doc } = await container.item('daily-tracker-data').read();
    const entries = doc.entries || [];
    const qaMembers = doc.qaMembers || [];

    console.log('✅ Tracker data loaded from Cosmos DB');
    res.json({ success: true, entries, qaMembers });
  } catch (error) {
    console.log('No tracker data found, returning empty arrays');
    res.json({ success: true, entries: [], qaMembers: [] });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running', database: 'Cosmos DB' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend API running on port ${PORT}`);
  console.log('📊 Using Azure Cosmos DB for data storage');
  console.log('🔐 Authentication enabled');
});

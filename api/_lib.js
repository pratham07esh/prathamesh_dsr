import { CosmosClient } from '@azure/cosmos';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const COSMOS_CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING;

// Get Cosmos container
export const getContainer = async () => {
  if (!COSMOS_CONNECTION_STRING) {
    throw new Error('COSMOS_CONNECTION_STRING not set');
  }
  const client = new CosmosClient({ connectionString: COSMOS_CONNECTION_STRING });
  const database = client.database('prathmeshcosmosdbdev');
  return database.container('prathmeshcosmoscontainer1');
};

// Password helpers
export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// JWT helpers
export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions || { canAdd: true, canEdit: true, canDelete: true },
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const verifyJwt = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new Error('No token provided');
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const requireAdmin = (decoded) => {
  if (decoded.role !== 'admin') {
    throw new Error('Admin access required');
  }
};

// User queries
export const findUserByUsername = async (container, username) => {
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

export const findUserById = async (container, userId) => {
  try {
    const { resource } = await container.item(userId).read();
    return resource || null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
};

export const getAllUsers = async (container) => {
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

// CORS headers
export const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

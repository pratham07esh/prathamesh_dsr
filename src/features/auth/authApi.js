// Centralized API calls for authentication
// Dynamically detect localhost vs production

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
export const API_BASE_URL = isLocalhost ? 'http://localhost:3001' : '';

const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Register new user
export const registerUser = async (username, email, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return response.json();
};

// User login
export const loginUser = async (usernameOrEmail, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password }),
  });
  return response.json();
};

// Admin login
export const adminLogin = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
};

// Seed admin
export const seedAdmin = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/seed-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return response.json();
};

// Get all users (admin only)
export const getAllUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  return response.json();
};

// Approve user (admin only)
export const approveUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ userId }),
  });
  return response.json();
};

// Reject user (admin only)
export const rejectUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reject`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ userId }),
  });
  return response.json();
};

// Change user role (admin only)
export const changeUserRole = async (userId, newRole) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ userId, newRole }),
  });
  return response.json();
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/user/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  return response.json();
};

// Update user permissions (admin only)
export const updateUserPermissions = async (userId, permissions) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/permissions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ userId, permissions }),
  });
  return response.json();
};

// Verify token
export const verifyToken = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  return response.json();
};

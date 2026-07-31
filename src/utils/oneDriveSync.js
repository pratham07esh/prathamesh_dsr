// Database sync configuration
const isLocalhost = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

const API_BASE_URL = isLocalhost() ? 'http://localhost:3001' : '';

export const initializeDatabaseSync = async () => {
  // Check if backend/database is reachable
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Database backend connected');
      return true;
    }
  } catch (error) {
    console.warn('Database backend not available, using localStorage only');
    return false;
  }
};

export const saveToDatabase = async (entries, qaMembers, approvedUsers, pendingRequests) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries, qaMembers, approvedUsers, pendingRequests }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Data saved to database');
      return { success: true };
    } else {
      console.error('Failed to save to database:', result.error);
      localStorage.setItem('dailyEntries', JSON.stringify(entries));
      localStorage.setItem('qaMembers', JSON.stringify(qaMembers));
      return { success: false };
    }
  } catch (error) {
    console.warn('Database unavailable:', error.message);
    localStorage.setItem('dailyEntries', JSON.stringify(entries));
    localStorage.setItem('qaMembers', JSON.stringify(qaMembers));
    return { success: false };
  }
};

export const loadFromDatabase = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/load`);
    const result = await response.json();

    if (result.success) {
      console.log('✅ Data loaded from database');
      return {
        entries: result.entries || [],
        qaMembers: result.qaMembers || [],
        approvedUsers: result.approvedUsers || [],
        pendingRequests: result.pendingRequests || []
      };
    }
  } catch (error) {
    console.warn('Database unavailable:', error.message);
  }

  // Fall back to localStorage only for entries and qaMembers, not for access control data
  const entries = JSON.parse(localStorage.getItem('dailyEntries') || '[]');
  const qaMembers = JSON.parse(localStorage.getItem('qaMembers') || '[]');
  if (entries.length > 0 || qaMembers.length > 0) {
    console.log('✅ Data loaded from localStorage (fallback for entries/qaMembers only)');
  }
  return { entries, qaMembers, approvedUsers: [], pendingRequests: [] };
};

// Legacy OneDrive naming - kept for backwards compatibility
export const initializeOneDriveSync = initializeDatabaseSync;
export const saveToOneDrive = saveToDatabase;
export const loadFromOneDrive = loadFromDatabase;

export const selectOneDriveFolder = async () => {
  console.warn('Not applicable for web version');
  return { success: false };
};

export const getOneDriveFolder = async () => {
  return null;
};

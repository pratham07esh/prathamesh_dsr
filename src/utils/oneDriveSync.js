// Auto-detect: Use Vercel Functions in production, local backend in development
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : '/api';

export const initializeOneDriveSync = async () => {
  // Just check if backend is reachable
  try {
    const response = await fetch(`${API_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Backend connected');
      return true;
    }
  } catch (error) {
    console.warn('Backend not available, using localStorage only');
    return false;
  }
};

export const saveToOneDrive = async (entries, qaMembers) => {
  try {
    const response = await fetch(`${API_URL}/api/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries, qaMembers }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Data saved to Cosmos DB');
      return { success: true };
    } else {
      console.error('Failed to save:', result.error);
      // Fallback to localStorage
      localStorage.setItem('dailyEntries', JSON.stringify(entries));
      localStorage.setItem('qaMembers', JSON.stringify(qaMembers));
      return { success: false };
    }
  } catch (error) {
    console.warn('Backend unavailable, saving to localStorage:', error.message);
    localStorage.setItem('dailyEntries', JSON.stringify(entries));
    localStorage.setItem('qaMembers', JSON.stringify(qaMembers));
    return { success: false };
  }
};

export const loadFromOneDrive = async () => {
  try {
    const response = await fetch(`${API_URL}/api/load`);
    const result = await response.json();

    if (result.success) {
      console.log('✅ Data loaded from Cosmos DB');
      return { entries: result.entries || [], qaMembers: result.qaMembers || [] };
    }
  } catch (error) {
    console.warn('Backend unavailable, checking localStorage:', error.message);
  }

  // Fallback to localStorage only if backend is unavailable
  const entries = JSON.parse(localStorage.getItem('dailyEntries') || '[]');
  const qaMembers = JSON.parse(localStorage.getItem('qaMembers') || '[]');
  if (entries.length > 0 || qaMembers.length > 0) {
    console.log('✅ Data loaded from localStorage (fallback)');
  }
  return { entries, qaMembers };
};

export const selectOneDriveFolder = async () => {
  console.warn('Not applicable for web version');
  return { success: false };
};

export const getOneDriveFolder = async () => {
  return null;
};

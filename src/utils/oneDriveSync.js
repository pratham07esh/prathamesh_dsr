const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

export const initializeOneDriveSync = async () => {
  if (!isElectron()) return;

  const folderPath = await window.electronAPI.getOneDriveFolder();

  if (!folderPath) {
    const result = await window.electronAPI.selectOneDriveFolder();
    if (!result.success) {
      console.warn('OneDrive folder not selected');
      return false;
    }
  }

  // Watch for changes
  await window.electronAPI.watchOneDriveFolder();

  // Listen for file changes
  window.electronAPI.onOneDriveDataChanged(() => {
    window.dispatchEvent(new CustomEvent('onedrive-data-changed'));
  });

  return true;
};

export const saveToOneDrive = async (entries, qaMembers) => {
  console.log('saveToOneDrive called. isElectron:', isElectron());
  console.log('window.electronAPI:', window.electronAPI);

  if (!isElectron()) {
    console.log('Not in Electron, saving to localStorage');
    localStorage.setItem('dailyEntries', JSON.stringify(entries));
    localStorage.setItem('qaMembers', JSON.stringify(qaMembers));
    return { success: true };
  }

  try {
    console.log('Saving to OneDrive via IPC...');
    const result = await window.electronAPI.saveDataToOneDrive({
      entries,
      qaMembers,
      lastSync: new Date().toISOString(),
    });

    if (result.success) {
      console.log('Data saved to OneDrive successfully');
    } else {
      console.error('Failed to save to OneDrive:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Error saving to OneDrive:', error);
    // Fallback to localStorage
    localStorage.setItem('dailyEntries', JSON.stringify(entries));
    localStorage.setItem('qaMembers', JSON.stringify(qaMembers));
    return { success: false, error: error.message };
  }
};

export const loadFromOneDrive = async () => {
  if (!isElectron()) {
    // Fallback to localStorage if not in Electron
    const entries = JSON.parse(localStorage.getItem('dailyEntries') || '[]');
    const qaMembers = JSON.parse(localStorage.getItem('qaMembers') || '[]');
    return { entries, qaMembers };
  }

  try {
    const result = await window.electronAPI.loadDataFromOneDrive();

    if (result.success && (result.entries.length > 0 || result.qaMembers.length > 0)) {
      console.log('Data loaded from OneDrive');
      return {
        entries: result.entries,
        qaMembers: result.qaMembers,
      };
    } else {
      console.warn('OneDrive empty, checking localStorage...');
      // Fallback to localStorage if OneDrive is empty
      const entries = JSON.parse(localStorage.getItem('dailyEntries') || '[]');
      const qaMembers = JSON.parse(localStorage.getItem('qaMembers') || '[]');
      if (entries.length > 0 || qaMembers.length > 0) {
        console.log('Data loaded from localStorage');
      }
      return { entries, qaMembers };
    }
  } catch (error) {
    console.error('Error loading from OneDrive:', error);
    // Fallback to localStorage
    const entries = JSON.parse(localStorage.getItem('dailyEntries') || '[]');
    const qaMembers = JSON.parse(localStorage.getItem('qaMembers') || '[]');
    console.log('Data loaded from localStorage (fallback)');
    return { entries, qaMembers };
  }
};

export const selectOneDriveFolder = async () => {
  if (!isElectron()) {
    console.warn('Not running in Electron');
    return { success: false };
  }

  return await window.electronAPI.selectOneDriveFolder();
};

export const getOneDriveFolder = async () => {
  if (!isElectron()) {
    return null;
  }

  return await window.electronAPI.getOneDriveFolder();
};

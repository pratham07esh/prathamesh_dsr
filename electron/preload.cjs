const { ipcRenderer } = require('electron');

window.electronAPI = {
  selectOneDriveFolder: () => ipcRenderer.invoke('select-onedrive-folder'),
  getOneDriveFolder: () => ipcRenderer.invoke('get-onedrive-folder'),
  saveDataToOneDrive: (data) => ipcRenderer.invoke('save-data-to-onedrive', data),
  loadDataFromOneDrive: () => ipcRenderer.invoke('load-data-from-onedrive'),
  watchOneDriveFolder: () => ipcRenderer.invoke('watch-onedrive-folder'),
  onOneDriveDataChanged: (callback) => ipcRenderer.on('onedrive-data-changed', callback),
};

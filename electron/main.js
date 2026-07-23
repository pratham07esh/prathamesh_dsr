import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let oneDriveFolderPath = 'C:\\Users\\prathamesh.dasarwar\\OneDrive - Perficient, Inc\\Daily Track';

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  });

  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  let url;
  if (isDev) {
    url = 'http://localhost:5173';
  } else {
    // In production, load from dist folder
    const appDir = path.dirname(app.getAppPath());
    const distPath = path.join(appDir, 'dist', 'index.html');
    url = `file://${distPath}`;
    console.log('Production mode');
    console.log('App directory:', appDir);
    console.log('Loading URL:', url);
  }

  mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', () => {
  createWindow();
  initializeOneDrivePath();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Initialize OneDrive folder path on first run
const initializeOneDrivePath = () => {
  // Path is hardcoded, just ensure it exists
  if (!fs.existsSync(oneDriveFolderPath)) {
    fs.mkdirSync(oneDriveFolderPath, { recursive: true });
  }
  console.log('OneDrive folder ready:', oneDriveFolderPath);
};

// IPC Handler: Select OneDrive Folder
ipcMain.handle('select-onedrive-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select OneDrive Folder',
    defaultPath: 'C:\\Users\\' + require('os').userInfo().username + '\\OneDrive - Perficient, Inc',
  });

  if (!result.canceled && result.filePaths.length > 0) {
    oneDriveFolderPath = result.filePaths[0];

    // Save to config
    const configPath = path.join(app.getPath('userData'), 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ oneDriveFolderPath }, null, 2));

    return { success: true, path: oneDriveFolderPath };
  }

  return { success: false };
});

// IPC Handler: Get OneDrive Folder Path
ipcMain.handle('get-onedrive-folder', () => {
  return oneDriveFolderPath;
});

// IPC Handler: Save Data to OneDrive
ipcMain.handle('save-data-to-onedrive', async (event, data) => {
  try {
    if (!oneDriveFolderPath) {
      return { success: false, error: 'OneDrive folder not selected' };
    }

    // Ensure folder exists
    if (!fs.existsSync(oneDriveFolderPath)) {
      fs.mkdirSync(oneDriveFolderPath, { recursive: true });
    }

    // Save entries
    const entriesPath = path.join(oneDriveFolderPath, 'daily-status-data.json');
    fs.writeFileSync(entriesPath, JSON.stringify(data.entries, null, 2));

    // Save QA Members
    const membersPath = path.join(oneDriveFolderPath, 'qa-members.json');
    fs.writeFileSync(membersPath, JSON.stringify(data.qaMembers, null, 2));

    // Create backup
    const timestamp = new Date().toISOString().slice(0, 10);
    const backupPath = path.join(oneDriveFolderPath, `backup-${timestamp}.json`);
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving data:', error);
    return { success: false, error: error.message };
  }
});

// IPC Handler: Load Data from OneDrive
ipcMain.handle('load-data-from-onedrive', async () => {
  try {
    if (!oneDriveFolderPath || !fs.existsSync(oneDriveFolderPath)) {
      return { success: false, error: 'OneDrive folder not accessible' };
    }

    const entriesPath = path.join(oneDriveFolderPath, 'daily-status-data.json');
    const membersPath = path.join(oneDriveFolderPath, 'qa-members.json');

    const entries = fs.existsSync(entriesPath)
      ? JSON.parse(fs.readFileSync(entriesPath, 'utf-8'))
      : [];

    const qaMembers = fs.existsSync(membersPath)
      ? JSON.parse(fs.readFileSync(membersPath, 'utf-8'))
      : [];

    return {
      success: true,
      entries,
      qaMembers,
      folderPath: oneDriveFolderPath
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return { success: false, error: error.message };
  }
});

// IPC Handler: Watch for file changes
ipcMain.handle('watch-onedrive-folder', async () => {
  if (!oneDriveFolderPath) {
    return { success: false };
  }

  try {
    fs.watchFile(path.join(oneDriveFolderPath, 'daily-status-data.json'), () => {
      mainWindow.webContents.send('onedrive-data-changed');
    });
    return { success: true };
  } catch (error) {
    console.error('Error watching folder:', error);
    return { success: false };
  }
});

function selectOneDriveFolder() {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Your OneDrive Daily Track Folder',
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      oneDriveFolderPath = result.filePaths[0];
      const configPath = path.join(app.getPath('userData'), 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({ oneDriveFolderPath }, null, 2));
    }
  });
}

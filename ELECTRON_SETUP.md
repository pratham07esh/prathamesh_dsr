# Daily Status Tracker - Electron Desktop App Setup

## Overview
This is now a desktop application that syncs data to your OneDrive folder in real-time. All team members can use the same app and automatically see each other's data.

## Installation & Setup

### For Development (Running locally):

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```
   (Keep this terminal open)

3. **In a new terminal, run Electron**:
   ```bash
   npm run electron-dev
   ```

4. **First run**:
   - App will ask you to select your OneDrive folder
   - Select: `C:\Users\[YourName]\OneDrive - Perficient, Inc\Daily Track`
   - Click "Continue"
   - ✅ App is ready!

### For Production (Creating .exe installer):

1. **Build the desktop app**:
   ```bash
   npm run electron-build
   ```

2. **Find the installer**:
   - Look in: `dist/Daily Status Tracker Setup 1.0.0.exe`
   - This is the installer your team will use

3. **Share with team**:
   - Send them the `.exe` file
   - They run it to install
   - First run: select their OneDrive folder
   - ✅ They see your data instantly!

## How It Works

### Your Data Flow:
```
App Changes
  ↓
Auto-saves to OneDrive folder
  ↓
OneDrive auto-syncs (5-30 seconds)
  ↓
Team's app auto-detects change
  ↓
Team sees your updates instantly ✅
```

### Folders Created:
- `daily-status-data.json` - Main data file (entries & QA members)
- `qa-members.json` - QA members backup
- `backup-YYYY-MM-DD.json` - Daily automatic backups

## Real-Time Sync

✅ **Auto-Syncing**:
- Every action (add/edit/delete) auto-saves
- No manual "Save" button needed
- OneDrive handles sync (company infrastructure)

✅ **Team Collaboration**:
- All team members point to same OneDrive folder
- Changes visible within 30 seconds
- Works completely offline (syncs when online)

✅ **Offline Mode**:
- Works without internet
- Data saves locally
- Auto-syncs when back online

## OneDrive Sync Status

- 🔵 **Sync** (Blue) - Select folder to enable sync
- 🟢 **Synced** (Green) - OneDrive folder selected and syncing

Click the button to change or re-select your OneDrive folder anytime.

## Features

✅ Automatic data persistence to OneDrive
✅ Real-time sync with team members
✅ Offline support (auto-sync on reconnect)
✅ Daily automatic backups
✅ No internet required for local edits
✅ Company infrastructure only (no external services)
✅ Professional desktop application

## Troubleshooting

**Issue**: "OneDrive folder not accessible"
- Solution: Make sure the folder path is correct and you have write permissions

**Issue**: Data not syncing
- Solution: Check if OneDrive folder is properly selected (green "Synced" button)
- Restart the app

**Issue**: Team member doesn't see my changes
- Solution: Verify they selected the same OneDrive folder path
- Wait 30-60 seconds (OneDrive sync delay)
- Refresh their app

## Team Distribution

**Share with your team**:
1. Create the installer: `npm run electron-build`
2. Send them `dist/Daily Status Tracker Setup 1.0.0.exe`
3. They run installer
4. First run: they select the same OneDrive folder
5. ✅ Everyone synced!

**No code sharing needed** - they just need the .exe file!

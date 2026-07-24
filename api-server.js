import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// OneDrive folder path - change this for other users
const oneDriveFolderPath = 'C:\\Users\\prathamesh.dasarwar\\OneDrive - Perficient, Inc\\Daily Track';

// Ensure folder exists
if (!fs.existsSync(oneDriveFolderPath)) {
  fs.mkdirSync(oneDriveFolderPath, { recursive: true });
}

// API: Save data to OneDrive
app.post('/api/save', (req, res) => {
  try {
    const { entries, qaMembers } = req.body;

    // Save entries
    const entriesPath = path.join(oneDriveFolderPath, 'daily-status-data.json');
    fs.writeFileSync(entriesPath, JSON.stringify(entries, null, 2));

    // Save QA Members
    const membersPath = path.join(oneDriveFolderPath, 'qa-members.json');
    fs.writeFileSync(membersPath, JSON.stringify(qaMembers, null, 2));

    // Create daily backup
    const timestamp = new Date().toISOString().slice(0, 10);
    const backupPath = path.join(oneDriveFolderPath, `backup-${timestamp}.json`);
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, JSON.stringify({ entries, qaMembers, timestamp }, null, 2));
    }

    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Load data from OneDrive
app.get('/api/load', (req, res) => {
  try {
    const entriesPath = path.join(oneDriveFolderPath, 'daily-status-data.json');
    const membersPath = path.join(oneDriveFolderPath, 'qa-members.json');

    const entries = fs.existsSync(entriesPath)
      ? JSON.parse(fs.readFileSync(entriesPath, 'utf-8'))
      : [];

    const qaMembers = fs.existsSync(membersPath)
      ? JSON.parse(fs.readFileSync(membersPath, 'utf-8'))
      : [];

    res.json({ success: true, entries, qaMembers });
  } catch (error) {
    console.error('Error loading data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running', folderPath: oneDriveFolderPath });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend API running on http://localhost:${PORT}`);
  console.log(`📁 OneDrive folder: ${oneDriveFolderPath}`);
});

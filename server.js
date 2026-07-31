import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const dataFile = path.join(__dirname, 'data.json');

const initDataFile = () => {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({ entries: [], qaMembers: [], approvedUsers: [], pendingRequests: [] }));
  }
};

const readData = () => {
  initDataFile();
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
};

const writeData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

app.get('/api/health', (req, res) => {
  res.json({ success: true });
});

app.post('/api/save', (req, res) => {
  const { entries, qaMembers, approvedUsers, pendingRequests } = req.body;
  try {
    writeData({ entries, qaMembers, approvedUsers, pendingRequests });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/load', (req, res) => {
  try {
    const data = readData();
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { CosmosClient } from '@azure/cosmos';

dotenv.config({ path: '.env.local' });

const app = express();

// CORS configuration - must be first
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://dsr-two.vercel.app'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

// Cosmos DB connection
const connectionString = process.env.COSMOS_CONNECTION_STRING;

if (!connectionString) {
  console.error('❌ COSMOS_CONNECTION_STRING environment variable not set');
  process.exit(1);
}

const client = new CosmosClient({ connectionString });
const database = client.database('prathmeshcosmosdbdev');
const container = database.container('prathmeshcosmoscontainer1');

// Initialize Cosmos DB
const initCosmosDB = async () => {
  try {
    await database.read();
    console.log('✅ Connected to Cosmos DB');
  } catch (error) {
    console.error('❌ Cosmos DB connection failed:', error.message);
  }
};

initCosmosDB();

// API: Save data to Cosmos DB
app.post('/api/save', async (req, res) => {
  try {
    const { entries, qaMembers } = req.body;

    // Save all data in one document
    await container.items.upsert({
      id: 'daily-tracker-data',
      entries,
      qaMembers,
      timestamp: new Date().toISOString(),
    });

    console.log('✅ Data saved to Cosmos DB');
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Load data from Cosmos DB
app.get('/api/load', async (req, res) => {
  try {
    const { resource: doc } = await container.item('daily-tracker-data').read();
    const entries = doc.entries || [];
    const qaMembers = doc.qaMembers || [];

    console.log('✅ Data loaded from Cosmos DB');
    res.json({ success: true, entries, qaMembers });
  } catch (error) {
    console.log('No data found, returning empty arrays');
    res.json({ success: true, entries: [], qaMembers: [] });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running', database: 'Cosmos DB' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend API running on port ${PORT}`);
  console.log('📊 Using Azure Cosmos DB for data storage');
});

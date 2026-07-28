import { CosmosClient } from '@azure/cosmos';

const connectionString = process.env.COSMOS_CONNECTION_STRING;

export default async function handler(req, res) {
  if (!connectionString) {
    return res.status(500).json({ error: 'COSMOS_CONNECTION_STRING not set' });
  }

  try {
    const client = new CosmosClient({ connectionString });
    const database = client.database('prathmeshcosmosdbdev');
    const container = database.container('prathmeshcosmoscontainer1');

    if (req.method === 'POST') {
      // Save endpoint
      const { entries, qaMembers } = req.body;

      await container.items.upsert({
        id: 'daily-tracker-data',
        entries,
        qaMembers,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ success: true, message: 'Data saved successfully' });
    } else if (req.method === 'GET') {
      // Load endpoint
      try {
        const { resource: doc } = await container.item('daily-tracker-data').read();
        const entries = doc.entries || [];
        const qaMembers = doc.qaMembers || [];

        return res.status(200).json({ success: true, entries, qaMembers });
      } catch (error) {
        return res.status(200).json({ success: true, entries: [], qaMembers: [] });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

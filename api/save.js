import { CosmosClient } from '@azure/cosmos';

const connectionString = process.env.COSMOS_CONNECTION_STRING;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { entries, qaMembers } = req.body;

    const client = new CosmosClient({ connectionString });
    const database = client.database('prathmeshcosmosdbdev');
    const container = database.container('prathmeshcosmoscontainer1');

    await container.items.upsert({
      id: 'daily-tracker-data',
      entries,
      qaMembers,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

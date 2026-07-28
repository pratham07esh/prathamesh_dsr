import { CosmosClient } from '@azure/cosmos';

const connectionString = process.env.COSMOS_CONNECTION_STRING;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = new CosmosClient({ connectionString });
    const database = client.database('prathmeshcosmosdbdev');
    const container = database.container('prathmeshcosmoscontainer1');

    const { resource: doc } = await container.item('daily-tracker-data').read();
    const entries = doc.entries || [];
    const qaMembers = doc.qaMembers || [];

    return res.status(200).json({ success: true, entries, qaMembers });
  } catch (error) {
    console.log('No data found');
    return res.status(200).json({ success: true, entries: [], qaMembers: [] });
  }
}

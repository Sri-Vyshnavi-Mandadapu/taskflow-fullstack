import { existsSync } from 'node:fs';
import { MongoClient } from 'mongodb';

if (existsSync('.env')) process.loadEnvFile('.env');
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing. Add your Atlas connection URI to .env.');
  process.exit(1);
}
let client;
try {
  client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  await client.db(process.env.MONGODB_DB || 'taskflow').collection('boards').findOne({ _id: 'workspace' }, { projection: { _id: 1 } });
  console.log('Connected to MongoDB; the workspace collection is readable.');
} catch (error) {
  console.error(`Database check failed (${error.name}). Check credentials and Atlas network access.`);
  process.exitCode = 1;
} finally {
  await client?.close();
}

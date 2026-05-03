require('dotenv').config({ path: __dirname + '/../.env.local' });
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('../src/db/schema');

async function clearDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log('Clearing habits table...');
  await db.delete(schema.habits);
  console.log('Clearing logs table...');
  await db.delete(schema.logs);
  console.log('Done!');
  process.exit(0);
}

clearDatabase().catch(console.error);

import { neon } from '@neondatabase/serverless';
import * as schema from '../src/db/schema';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../.env.local' });

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

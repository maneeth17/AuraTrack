require('dotenv').config({ path: __dirname + '/../.env.local' });
const { neon } = require('@neondatabase/serverless');

async function clearDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('Clearing habits table...');
  await sql`DELETE FROM habits`;
  console.log('Clearing logs table...');
  await sql`DELETE FROM logs`;
  console.log('Done!');
  process.exit(0);
}

clearDatabase().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

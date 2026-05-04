require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  const logs = await sql`SELECT * FROM logs ORDER BY created_at DESC LIMIT 5`;
  console.log('Recent logs:', logs);
}

main().catch(console.error);

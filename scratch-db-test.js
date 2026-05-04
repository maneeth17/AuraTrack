require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  const habits = await sql`SELECT title, target_count FROM habits LIMIT 10`;
  console.log('Habits:', habits);
}

main().catch(console.error);

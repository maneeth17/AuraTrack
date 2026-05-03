

async function test() {
  console.log('Testing login...');
  
  // Actually we need to hit the NextAuth credentials endpoint directly
  // It's easier to just hit the database and see if there are any habits at all
  
  const pg = await import('pg');
  const { Client } = pg.default;
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  await client.connect();
  
  const users = await client.query('SELECT * FROM users');
  console.log('Users:', users.rows.length);
  
  const habits = await client.query('SELECT * FROM habits');
  console.log('Habits:', habits.rows.length);
  
  const logs = await client.query('SELECT * FROM logs');
  console.log('Logs:', logs.rows.length);
  
  await client.end();
}

test().catch(console.error);

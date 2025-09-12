const { Client } = require('pg');

async function createDatabase() {
  console.log('🔧 Setting up PostgreSQL database...');
  
  const connectionConfig = {
    host: 'localhost',
    port: 5000,
    user: 'postgres',
    password: 'Anujith',
    // Don't specify database for initial connection
  };

  const client = new Client(connectionConfig);

  try {
    console.log('📡 Connecting to PostgreSQL server...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database exists
    console.log('🔍 Checking if database "Edu-Platform" exists...');
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'Edu-Platform'"
    );

    if (result.rows.length === 0) {
      console.log('📝 Database does not exist. Creating "Edu-Platform" database...');
      await client.query('CREATE DATABASE "Edu-Platform"');
      console.log('✅ Database "Edu-Platform" created successfully!');
    } else {
      console.log('✅ Database "Edu-Platform" already exists');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 PostgreSQL server is not running or not accessible on port 5000');
      console.error('   Please check:');
      console.error('   1. PostgreSQL service is started');
      console.error('   2. PostgreSQL is configured to listen on port 5000');
      console.error('   3. Firewall is not blocking the connection');
    } else if (error.code === '28P01') {
      console.error('💡 Authentication failed');
      console.error('   Please check username and password in .env file');
    }
  } finally {
    await client.end();
  }
}

createDatabase();
// setup-database.js
const sql = require('mssql');
const fs = require('fs');

const config = {
  server: 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'Password123!'
    }
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
      connectTimeout: 60000,
      instancename: 'SQLEXPRESS'
  }
};

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to SQL Server...');
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to SQL Server');

    // Create database
    console.log('🔄 Creating database InventorySalesDB...');
    const result = await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'InventorySalesDB')
      BEGIN
        CREATE DATABASE InventorySalesDB
      END
    `);
    console.log('✅ Database created or already exists');

    // Close and reconnect to new database
    await pool.close();

    // Create new config with database
    const dbConfig = { ...config };
    dbConfig.database = 'InventorySalesDB';

    const dbPool = new sql.ConnectionPool(dbConfig);
    await dbPool.connect();
    console.log('✅ Connected to InventorySalesDB');

    // Read and execute schema script
    console.log('🔄 Creating schema...');
    const schemaScript = fs.readFileSync('Database/SQL/01-schema-initialization.sql', 'utf8');
    const schemaBatches = schemaScript.split('GO\n');
    
    for (let batch of schemaBatches) {
      if (batch.trim()) {
        try {
          await dbPool.request().query(batch);
        } catch (e) {
          console.log('Note:', e.message);
        }
      }
    }
    console.log('✅ Schema created');

    // Execute stored procedure script
    console.log('🔄 Creating stored procedure...');
    const procScript = fs.readFileSync('Database/SQL/02-stored-procedure-sale.sql', 'utf8');
    const procBatches = procScript.split('GO\n');
    
    for (let batch of procBatches) {
      if (batch.trim()) {
        try {
          await dbPool.request().query(batch);
        } catch (e) {
          console.log('Note:', e.message);
        }
      }
    }
    console.log('✅ Stored procedure created');

    // Execute trigger script
    console.log('🔄 Creating trigger...');
    const triggerScript = fs.readFileSync('Database/SQL/03-audit-trigger.sql', 'utf8');
    const triggerBatches = triggerScript.split('GO\n');
    
    for (let batch of triggerBatches) {
      if (batch.trim()) {
        try {
          await dbPool.request().query(batch);
        } catch (e) {
          console.log('Note:', e.message);
        }
      }
    }
    console.log('✅ Trigger created');

    // Verify data
    console.log('🔄 Verifying data...');
    const countResult = await dbPool.request().query('SELECT COUNT(*) as count FROM Products');
    console.log(`✅ Database setup complete! Products: ${countResult.recordset[0].count}`);

    await dbPool.close();
    console.log('✅ All done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setupDatabase();

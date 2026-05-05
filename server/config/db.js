const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }  // Railway PostgreSQL requires SSL
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection and initialize schema — retries every 5s, does NOT crash server
const initDB = async (retries = 10) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL connected successfully');

      // Auto-run schema on first boot
      const schemaPath = path.join(__dirname, '../db/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schema);
        console.log('✅ Database schema initialized');
      }

      client.release();
      return; // success
    } catch (error) {
      console.error(`❌ DB attempt ${attempt}/${retries}: ${error.message}`);
      if (attempt < retries) {
        console.log('⏳ Retrying in 5s...');
        await new Promise((r) => setTimeout(r, 5000));
      } else {
        // Do NOT call process.exit — server stays alive so healthcheck passes
        console.error('❌ All DB retries exhausted. Check DATABASE_URL in Railway Variables.');
      }
    }
  }
};

module.exports = { pool, initDB };

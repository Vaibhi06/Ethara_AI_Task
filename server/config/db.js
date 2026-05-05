const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ─── Guard: check DATABASE_URL exists ─────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  console.error('   → On Railway: add variable DATABASE_URL = ${{ Postgres.DATABASE_URL }}');
  console.error('   → Locally: set it in server/.env');
}

// ─── Smart SSL detection ───────────────────────────────────────────────────────
// Railway internal URL (postgres.railway.internal) → NO SSL needed
// Railway public URL (rlwy.net) or other external hosts → SSL required
const dbUrl = process.env.DATABASE_URL || '';
const isInternalRailway = dbUrl.includes('railway.internal');
const isProduction = process.env.NODE_ENV === 'production';

const sslConfig = isProduction && !isInternalRailway
  ? { rejectUnauthorized: false }  // public/external PostgreSQL — needs SSL
  : false;                          // internal Railway network — no SSL needed

console.log(`🔌 DB SSL mode: ${sslConfig ? 'enabled (public host)' : 'disabled (internal/local)'}`);

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection and initialize schema — retries every 5s, does NOT crash server
const initDB = async (retries = 10) => {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Skipping DB init — DATABASE_URL is not set.');
    return;
  }

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
      const msg = error?.message || error?.code || JSON.stringify(error) || 'unknown error';
      console.error(`❌ DB attempt ${attempt}/${retries}: ${msg}`);
      if (attempt < retries) {
        console.log('⏳ Retrying in 5s...');
        await new Promise((r) => setTimeout(r, 5000));
      } else {
        console.error('❌ All DB retries exhausted. Check DATABASE_URL in Railway Variables.');
        console.error(`   Current DATABASE_URL host: ${dbUrl.split('@')[1]?.split('/')[0] || 'unknown'}`);
      }
    }
  }
};

module.exports = { pool, initDB };

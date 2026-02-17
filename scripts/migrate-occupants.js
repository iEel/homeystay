const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function migrate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS occupants INT DEFAULT 1');
        console.log('✅ Added occupants column to tenants table');
        await pool.query('UPDATE tenants SET occupants = 1 WHERE occupants IS NULL');
        console.log('✅ Set default occupants = 1 for all existing tenants');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrate();

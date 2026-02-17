const { Pool } = require('pg');

async function migrate() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:p@assw0rd@192.168.1.45:5432/postgres',
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

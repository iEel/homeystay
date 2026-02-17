const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        await pool.query(`
            ALTER TABLE floor_plan_positions 
            ADD COLUMN IF NOT EXISTS width DECIMAL(5,2) DEFAULT 8,
            ADD COLUMN IF NOT EXISTS height DECIMAL(5,2) DEFAULT 6
        `);
        console.log('✅ Added width/height columns to floor_plan_positions');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrate();

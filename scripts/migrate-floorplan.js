const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS floor_plan_positions (
                id SERIAL PRIMARY KEY,
                item_type VARCHAR(20) NOT NULL,
                item_id INT NOT NULL,
                pos_x DECIMAL(5,2) NOT NULL,
                pos_y DECIMAL(5,2) NOT NULL,
                floor INT DEFAULT 1,
                UNIQUE(item_type, item_id)
            );
        `);
        console.log('✅ Created floor_plan_positions table');
    } catch (error) {
        console.error('❌ Migration error:', error.message);
    } finally {
        await pool.end();
    }
}

migrate();

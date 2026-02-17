const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:p@assw0rd@192.168.1.45:5432/postgres',
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

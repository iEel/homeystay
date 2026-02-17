const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });


async function migrate() {
    const client = await pool.connect();
    try {
        // Add electric alert threshold (default 100 units)
        await client.query(`
            INSERT INTO settings (key, value, label) 
            VALUES ('electric_alert_units', '100', 'แจ้งเตือนไฟเกิน (หน่วย)')
            ON CONFLICT (key) DO NOTHING
        `);

        // Add water alert threshold (default 100 units)
        await client.query(`
            INSERT INTO settings (key, value, label) 
            VALUES ('water_alert_units', '100', 'แจ้งเตือนน้ำเกิน (หน่วย)')
            ON CONFLICT (key) DO NOTHING
        `);

        console.log('✅ Migration complete: alert threshold settings added');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();

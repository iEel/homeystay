const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:p@assw0rd@192.168.1.45:5432/postgres' });


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

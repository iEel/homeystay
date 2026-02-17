const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    await pool.query(
        "INSERT INTO settings (key, value, label) VALUES ('electric_extra_units', '0', 'หน่วยไฟฟ้าเพิ่มต่อห้อง'), ('water_extra_units', '0', 'หน่วยน้ำเพิ่มต่อห้อง') ON CONFLICT (key) DO NOTHING"
    );
    console.log('✅ Added extra units settings');
    await pool.end();
}
run();

const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:p@assw0rd@192.168.1.45:5432/postgres' });

async function run() {
    await pool.query(
        "INSERT INTO settings (key, value, label) VALUES ('electric_extra_units', '0', 'หน่วยไฟฟ้าเพิ่มต่อห้อง'), ('water_extra_units', '0', 'หน่วยน้ำเพิ่มต่อห้อง') ON CONFLICT (key) DO NOTHING"
    );
    console.log('✅ Added extra units settings');
    await pool.end();
}
run();

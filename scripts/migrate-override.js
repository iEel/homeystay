const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  try {
    // เพิ่ม override columns ใน meter_readings
    await pool.query(`
      ALTER TABLE meter_readings
      ADD COLUMN IF NOT EXISTS override_electric_units DECIMAL(10,2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS override_water_units DECIMAL(10,2) DEFAULT NULL
    `);
    console.log('✅ Added override columns to meter_readings');

    // เพิ่ม override column ใน shared_bathroom_readings
    await pool.query(`
      ALTER TABLE shared_bathroom_readings
      ADD COLUMN IF NOT EXISTS override_water_units DECIMAL(10,2) DEFAULT NULL
    `);
    console.log('✅ Added override column to shared_bathroom_readings');

    await pool.end();
    console.log('🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}
migrate();

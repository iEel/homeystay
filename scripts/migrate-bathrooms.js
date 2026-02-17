const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 1. สร้างตาราง bathrooms
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bathrooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created bathrooms table');

    // 2. สร้างตาราง bathroom_rooms (mapping)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bathroom_rooms (
        id SERIAL PRIMARY KEY,
        bathroom_id INT REFERENCES bathrooms(id) ON DELETE CASCADE,
        room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
        UNIQUE(bathroom_id, room_id)
      )
    `);
    console.log('✅ Created bathroom_rooms table');

    // 3. แก้ shared_bathroom_readings → เพิ่ม bathroom_id
    // ลบตารางเก่าและสร้างใหม่เพราะโครงสร้างเปลี่ยนมาก
    await pool.query('DROP TABLE IF EXISTS shared_bathroom_readings CASCADE');
    await pool.query(`
      CREATE TABLE shared_bathroom_readings (
        id SERIAL PRIMARY KEY,
        bathroom_id INT REFERENCES bathrooms(id) ON DELETE CASCADE,
        month VARCHAR(7) NOT NULL,
        water_prev DECIMAL(10,2) DEFAULT 0,
        water_curr DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(bathroom_id, month)
      )
    `);
    console.log('✅ Recreated shared_bathroom_readings with bathroom_id');

    // 4. เพิ่มข้อมูลตัวอย่าง: 4 ห้องน้ำ
    const existing = await pool.query('SELECT COUNT(*) FROM bathrooms');
    if (parseInt(existing.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO bathrooms (name) VALUES
          ('ห้องน้ำ 1'), ('ห้องน้ำ 2'), ('ห้องน้ำ 3'), ('ห้องน้ำ 4')
      `);
      console.log('✅ Inserted 4 sample bathrooms');
    }

    console.log('\n🎉 Migration complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrate();

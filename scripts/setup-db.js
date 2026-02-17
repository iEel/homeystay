const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSchema() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:p@assw0rd@192.168.1.45:5432/postgres',
    });

    try {
        const sql = fs.readFileSync(path.join(__dirname, 'src', 'lib', 'schema.sql'), 'utf8');
        await pool.query(sql);
        console.log('✅ Schema created successfully!');
        console.log('✅ Sample data inserted!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

runSchema();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runSchema() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
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

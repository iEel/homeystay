/**
 * Migration: Add performance indexes
 * Run: node scripts/migrate-indexes.js
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    const client = await pool.connect();

    try {
        console.log('Adding performance indexes...\n');

        const indexes = [
            // tenants: lookup by room, filter by active
            'CREATE INDEX IF NOT EXISTS idx_tenants_room_id ON tenants(room_id)',
            'CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active)',
            'CREATE INDEX IF NOT EXISTS idx_tenants_room_active ON tenants(room_id, is_active)',

            // meter_readings: lookup by month, composite key
            'CREATE INDEX IF NOT EXISTS idx_meter_readings_month ON meter_readings(month)',
            'CREATE INDEX IF NOT EXISTS idx_meter_readings_room_month ON meter_readings(room_id, month)',

            // shared_bathroom_readings: lookup by month
            'CREATE INDEX IF NOT EXISTS idx_shared_bathroom_month ON shared_bathroom_readings(month)',

            // invoices: lookup by month, status, room
            'CREATE INDEX IF NOT EXISTS idx_invoices_month ON invoices(month)',
            'CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)',
            'CREATE INDEX IF NOT EXISTS idx_invoices_room_month ON invoices(room_id, month)',

            // bathroom_rooms: lookup by bathroom
            'CREATE INDEX IF NOT EXISTS idx_bathroom_rooms_bathroom ON bathroom_rooms(bathroom_id)',
            'CREATE INDEX IF NOT EXISTS idx_bathroom_rooms_room ON bathroom_rooms(room_id)',

            // floor_plan_positions: lookup by type + floor
            'CREATE INDEX IF NOT EXISTS idx_floor_plan_floor ON floor_plan_positions(floor)',
        ];

        for (const sql of indexes) {
            const name = sql.match(/idx_\w+/)?.[0] || 'unknown';
            await client.query(sql);
            console.log(`  ✅ ${name}`);
        }

        console.log(`\n✅ Done! Added ${indexes.length} indexes.`);
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();

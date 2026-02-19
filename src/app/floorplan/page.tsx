import pool from '@/lib/db';
import { currentMonthBangkok } from '@/lib/timezone';
import FloorPlanPage from './FloorplanClient';

export const dynamic = 'force-dynamic';

export default async function FloorplanServerPage() {
    const month = currentMonthBangkok();

    const [roomsRes, bathroomsRes, tenantsRes, positionsRes, invoicesRes] = await Promise.all([
        pool.query('SELECT * FROM rooms ORDER BY number'),
        pool.query(`
            SELECT b.id, b.name,
            COALESCE(json_agg(json_build_object('room_id', br.room_id, 'room_number', r.number))
            FILTER (WHERE br.room_id IS NOT NULL), '[]') as rooms
            FROM bathrooms b
            LEFT JOIN bathroom_rooms br ON b.id = br.bathroom_id
            LEFT JOIN rooms r ON br.room_id = r.id
            GROUP BY b.id, b.name
            ORDER BY b.name
        `),
        pool.query(`
            SELECT t.id, t.name, t.is_active, t.occupants, r.number as room_number
            FROM tenants t
            LEFT JOIN rooms r ON t.room_id = r.id
            ORDER BY t.name
        `),
        pool.query('SELECT * FROM floor_plan_positions'),
        pool.query(`
            SELECT i.id, i.room_id, r.number as room_number, i.month,
                   i.rent, i.electric_cost, i.water_faucet_cost, i.water_shared_cost,
                   i.total_amount, i.status
            FROM invoices i
            JOIN rooms r ON i.room_id = r.id
            WHERE i.month = $1
            ORDER BY r.number
        `, [month]),
    ]);

    return (
        <FloorPlanPage
            initialRooms={roomsRes.rows}
            initialBathrooms={bathroomsRes.rows}
            initialTenants={tenantsRes.rows}
            initialPositions={positionsRes.rows}
            initialInvoices={invoicesRes.rows}
        />
    );
}

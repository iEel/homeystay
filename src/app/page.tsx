import pool from '@/lib/db';
import { currentMonthBangkok } from '@/lib/timezone';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const month = currentMonthBangkok();

    const [roomsRes, tenantsRes, invoicesRes, bathroomsRes, dashRes] = await Promise.all([
        pool.query('SELECT * FROM rooms ORDER BY number'),
        pool.query(`
            SELECT t.*, r.number as room_number
            FROM tenants t
            LEFT JOIN rooms r ON t.room_id = r.id
            ORDER BY t.is_active DESC, t.name
        `),
        pool.query(`
            SELECT i.*, r.number as room_number
            FROM invoices i
            JOIN rooms r ON i.room_id = r.id
            WHERE i.month = $1
            ORDER BY r.number
        `, [month]),
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
            SELECT
                month,
                COUNT(*)::int as invoice_count,
                COALESCE(SUM(rent), 0) as total_rent,
                COALESCE(SUM(electric_cost), 0) as total_electric,
                COALESCE(SUM(water_faucet_cost), 0) as total_water_faucet,
                COALESCE(SUM(water_shared_cost), 0) as total_water_shared,
                COALESCE(SUM(total_amount), 0) as total_amount,
                COALESCE(SUM(CASE WHEN status='paid' THEN total_amount ELSE 0 END), 0) as paid_amount,
                COALESCE(SUM(CASE WHEN status!='paid' THEN total_amount ELSE 0 END), 0) as pending_amount
            FROM invoices
            GROUP BY month
            ORDER BY month DESC
            LIMIT 6
        `),
    ]);

    return (
        <DashboardClient
            rooms={roomsRes.rows}
            tenants={tenantsRes.rows}
            invoices={invoicesRes.rows}
            bathrooms={bathroomsRes.rows}
            monthlyHistory={dashRes.rows.reverse()}
        />
    );
}

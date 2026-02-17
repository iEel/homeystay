import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        if (!month) {
            return NextResponse.json({ error: 'month parameter required' }, { status: 400 });
        }

        // 1. สรุปบิลรายเดือน
        const invoiceSummary = await pool.query(`
            SELECT 
                COUNT(*) as total_invoices,
                COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                COALESCE(SUM(rent), 0) as total_rent,
                COALESCE(SUM(electric_cost), 0) as total_electric,
                COALESCE(SUM(water_faucet_cost), 0) as total_water_faucet,
                COALESCE(SUM(water_shared_cost), 0) as total_water_shared,
                COALESCE(SUM(total_amount), 0) as grand_total,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) as total_collected,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'pending'), 0) as total_pending,
                COALESCE(SUM(electric_units), 0) as total_electric_units,
                COALESCE(SUM(water_faucet_units), 0) as total_water_faucet_units
            FROM invoices
            WHERE month = $1
        `, [month]);

        // 2. รายละเอียดบิลแต่ละห้อง
        const roomDetails = await pool.query(`
            SELECT i.*, r.number as room_number, r.floor, r.monthly_rent,
                   t.name as tenant_name, t.occupants
            FROM invoices i
            JOIN rooms r ON i.room_id = r.id
            LEFT JOIN tenants t ON t.room_id = r.id AND t.is_active = true
            WHERE i.month = $1
            ORDER BY r.number
        `, [month]);

        // 3. สรุปจำนวนห้อง
        const roomSummary = await pool.query(`
            SELECT 
                COUNT(*) as total_rooms,
                COUNT(*) FILTER (WHERE status = 'occupied') as occupied,
                COUNT(*) FILTER (WHERE status = 'available') as available,
                COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance
            FROM rooms
        `);

        // 4. ย้อนหลัง 6 เดือน (สำหรับกราฟ)
        const trendData = await pool.query(`
            SELECT 
                month,
                COALESCE(SUM(total_amount), 0) as total,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) as collected,
                COALESCE(SUM(rent), 0) as rent,
                COALESCE(SUM(electric_cost), 0) as electric,
                COALESCE(SUM(water_faucet_cost + water_shared_cost), 0) as water,
                COUNT(*) as invoice_count
            FROM invoices
            WHERE month >= (
                SELECT TO_CHAR(
                    TO_DATE($1 || '-01', 'YYYY-MM-DD') - INTERVAL '5 months', 
                    'YYYY-MM'
                )
            )
            AND month <= $1
            GROUP BY month
            ORDER BY month
        `, [month]);

        // 5. สรุปรายชั้น
        const floorSummary = await pool.query(`
            SELECT r.floor,
                   COUNT(*) as room_count,
                   COALESCE(SUM(i.total_amount), 0) as total,
                   COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'paid'), 0) as collected
            FROM invoices i
            JOIN rooms r ON i.room_id = r.id
            WHERE i.month = $1
            GROUP BY r.floor
            ORDER BY r.floor
        `, [month]);

        return NextResponse.json({
            summary: invoiceSummary.rows[0],
            rooms: roomDetails.rows,
            roomSummary: roomSummary.rows[0],
            trend: trendData.rows,
            floorSummary: floorSummary.rows,
        });
    } catch (error) {
        console.error('Error fetching report:', error);
        return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
    }
}

import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Get last 6 months of invoice data grouped by month
        const result = await pool.query(`
            SELECT 
                i.month,
                COUNT(*)::int as invoice_count,
                COALESCE(SUM(i.rent), 0)::float as total_rent,
                COALESCE(SUM(i.electric_cost), 0)::float as total_electric,
                COALESCE(SUM(i.water_faucet_cost), 0)::float as total_water_faucet,
                COALESCE(SUM(i.water_shared_cost), 0)::float as total_water_shared,
                COALESCE(SUM(i.total_amount), 0)::float as total_amount,
                COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0)::float as paid_amount,
                COALESCE(SUM(CASE WHEN i.status = 'pending' THEN i.total_amount ELSE 0 END), 0)::float as pending_amount
            FROM invoices i
            GROUP BY i.month
            ORDER BY i.month DESC
            LIMIT 6
        `);

        return NextResponse.json(result.rows.reverse()); // chronological order
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}

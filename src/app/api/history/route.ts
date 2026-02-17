import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const room_id = searchParams.get('room_id');

        // All invoices grouped by tenant, sorted by room and month
        let query = `
            SELECT
                i.id, i.room_id, i.month, i.status,
                i.rent, i.electric_units, i.electric_cost,
                i.water_faucet_units, i.water_faucet_cost,
                i.water_shared_cost, i.total_amount,
                r.number as room_number,
                t.name as tenant_name
            FROM invoices i
            JOIN rooms r ON i.room_id = r.id
            LEFT JOIN tenants t ON t.room_id = r.id AND t.is_active = true
        `;
        const params: string[] = [];

        if (room_id) {
            query += ' WHERE i.room_id = $1';
            params.push(room_id);
        }

        query += ' ORDER BY r.number, i.month DESC';

        const result = await pool.query(query, params);

        // Group by room
        const grouped: Record<number, {
            room_id: number;
            room_number: string;
            tenant_name: string | null;
            invoices: typeof result.rows;
            total_paid: number;
            total_pending: number;
            months_overdue: number;
        }> = {};

        for (const row of result.rows) {
            if (!grouped[row.room_id]) {
                grouped[row.room_id] = {
                    room_id: row.room_id,
                    room_number: row.room_number,
                    tenant_name: row.tenant_name,
                    invoices: [],
                    total_paid: 0,
                    total_pending: 0,
                    months_overdue: 0,
                };
            }
            grouped[row.room_id].invoices.push(row);
            const amount = parseFloat(row.total_amount);
            if (row.status === 'paid') {
                grouped[row.room_id].total_paid += amount;
            } else {
                grouped[row.room_id].total_pending += amount;
                grouped[row.room_id].months_overdue += 1;
            }
        }

        return NextResponse.json(Object.values(grouped));
    } catch (error) {
        console.error('Error fetching history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

import pool from '@/lib/db';
import { currentMonthBangkok } from '@/lib/timezone';
import BillingClient from './BillingClient';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
    const month = currentMonthBangkok();

    const result = await pool.query(`
        SELECT i.id, r.number as room_number, i.month,
               i.rent, i.electric_units, i.electric_cost,
               i.water_faucet_units, i.water_faucet_cost,
               i.water_shared_cost, i.total_amount, i.status
        FROM invoices i
        JOIN rooms r ON i.room_id = r.id
        WHERE i.month = $1
        ORDER BY r.number
    `, [month]);

    return (
        <BillingClient
            initialInvoices={result.rows}
            initialMonth={month}
        />
    );
}

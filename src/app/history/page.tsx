import pool from '@/lib/db';
import HistoryClient from './HistoryClient';
import type { RoomHistory } from './HistoryClient';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
    const result = await pool.query(`
        SELECT i.*, r.number as room_number, t.name as tenant_name
        FROM invoices i
        JOIN rooms r ON i.room_id = r.id
        LEFT JOIN tenants t ON t.room_id = r.id AND t.is_active = true
        ORDER BY r.number, i.month DESC
    `);

    // Group by room
    const roomMap = new Map<number, RoomHistory>();
    for (const inv of result.rows) {
        if (!roomMap.has(inv.room_id)) {
            roomMap.set(inv.room_id, {
                room_id: inv.room_id,
                room_number: inv.room_number,
                tenant_name: inv.tenant_name,
                invoices: [],
                total_paid: 0,
                total_pending: 0,
                months_overdue: 0,
            });
        }
        const room = roomMap.get(inv.room_id)!;
        room.invoices.push(inv);
        const amount = parseFloat(inv.total_amount);
        if (inv.status === 'paid') {
            room.total_paid += amount;
        } else {
            room.total_pending += amount;
            room.months_overdue++;
        }
    }

    const data: RoomHistory[] = Array.from(roomMap.values());

    return <HistoryClient initialData={data} />;
}

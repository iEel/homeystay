import pool from '@/lib/db';
import TenantsClient from './TenantsClient';

export const dynamic = 'force-dynamic';

export default async function TenantsPage() {
    const [tenantsRes, roomsRes] = await Promise.all([
        pool.query(`
            SELECT t.*, r.number as room_number
            FROM tenants t
            LEFT JOIN rooms r ON t.room_id = r.id
            ORDER BY t.is_active DESC, t.name
        `),
        pool.query('SELECT id, number, status FROM rooms ORDER BY number'),
    ]);

    return (
        <TenantsClient
            initialTenants={tenantsRes.rows}
            initialRooms={roomsRes.rows}
        />
    );
}

import pool from '@/lib/db';
import RoomsClient from './RoomsClient';
import type { Room } from './RoomsClient';

export const dynamic = 'force-dynamic';

export default async function RoomsPage() {
    const result = await pool.query('SELECT * FROM rooms ORDER BY number');
    const rooms: Room[] = result.rows;

    return <RoomsClient initialRooms={rooms} />;
}

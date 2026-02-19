import pool from '@/lib/db';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const [settingsRes, bathroomsRes, roomsRes] = await Promise.all([
        pool.query('SELECT key, value, label FROM settings ORDER BY key'),
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
        pool.query('SELECT id, number FROM rooms ORDER BY number'),
    ]);

    // Transform settings rows into Record<string, {value, label}>
    const settings: Record<string, { value: string; label: string }> = {};
    for (const row of settingsRes.rows) {
        settings[row.key] = { value: row.value, label: row.label };
    }

    return (
        <SettingsClient
            initialSettings={settings}
            initialBathrooms={bathroomsRes.rows}
            initialRooms={roomsRes.rows}
        />
    );
}

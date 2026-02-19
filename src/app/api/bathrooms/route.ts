import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET: ดึงห้องน้ำทั้งหมด + ห้องพักที่ assign
export async function GET() {
    try {
        const bathrooms = await pool.query('SELECT * FROM bathrooms ORDER BY id');
        const mappings = await pool.query(`
            SELECT br.bathroom_id, br.room_id, r.number as room_number
            FROM bathroom_rooms br
            JOIN rooms r ON br.room_id = r.id
            ORDER BY br.bathroom_id, r.number
        `);

        // Group rooms by bathroom
        const bathroomList = bathrooms.rows.map((b: { id: number; name: string; created_at: string }) => ({
            ...b,
            rooms: mappings.rows
                .filter((m: { bathroom_id: number }) => m.bathroom_id === b.id)
                .map((m: { room_id: number; room_number: string }) => ({
                    room_id: m.room_id,
                    room_number: m.room_number,
                })),
        }));

        return NextResponse.json(bathroomList);
    } catch (error) {
        console.error('Error fetching bathrooms:', error);
        return NextResponse.json({ error: 'Failed to fetch bathrooms' }, { status: 500 });
    }
}

// POST: สร้างห้องน้ำ + assign ห้องพัก
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, room_ids } = body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return NextResponse.json({ error: 'กรุณาระบุชื่อห้องน้ำ' }, { status: 400 });
        }
        if (room_ids && !Array.isArray(room_ids)) {
            return NextResponse.json({ error: 'room_ids ต้องเป็น array' }, { status: 400 });
        }

        const result = await pool.query(
            'INSERT INTO bathrooms (name) VALUES ($1) RETURNING *',
            [name]
        );
        const bathroomId = result.rows[0].id;

        // Assign rooms
        if (room_ids && room_ids.length > 0) {
            for (const roomId of room_ids) {
                await pool.query(
                    'INSERT INTO bathroom_rooms (bathroom_id, room_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [bathroomId, roomId]
                );
            }
        }

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating bathroom:', error);
        return NextResponse.json({ error: 'Failed to create bathroom' }, { status: 500 });
    }
}

// PUT: แก้ไขห้องน้ำ + reassign ห้องพัก
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, room_ids } = body;

        if (!id) return NextResponse.json({ error: 'ไม่พบ ID ห้องน้ำ' }, { status: 400 });
        if (!name || typeof name !== 'string' || !name.trim()) {
            return NextResponse.json({ error: 'กรุณาระบุชื่อห้องน้ำ' }, { status: 400 });
        }
        if (room_ids && !Array.isArray(room_ids)) {
            return NextResponse.json({ error: 'room_ids ต้องเป็น array' }, { status: 400 });
        }

        await pool.query('UPDATE bathrooms SET name=$1 WHERE id=$2', [name.trim(), id]);

        // Delete old mappings and insert new ones
        await pool.query('DELETE FROM bathroom_rooms WHERE bathroom_id=$1', [id]);
        if (room_ids && room_ids.length > 0) {
            for (const roomId of room_ids) {
                await pool.query(
                    'INSERT INTO bathroom_rooms (bathroom_id, room_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [id, roomId]
                );
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating bathroom:', error);
        return NextResponse.json({ error: 'Failed to update bathroom' }, { status: 500 });
    }
}

// DELETE: ลบห้องน้ำ
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: 'กรุณาระบุ ID ห้องน้ำที่ถูกต้อง' }, { status: 400 });
        }

        await pool.query('DELETE FROM bathrooms WHERE id=$1', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting bathroom:', error);
        return NextResponse.json({ error: 'Failed to delete bathroom' }, { status: 500 });
    }
}

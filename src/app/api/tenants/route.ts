import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const result = await pool.query(`
      SELECT t.*, r.number as room_number
      FROM tenants t
      LEFT JOIN rooms r ON t.room_id = r.id
      ORDER BY t.name
    `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, phone, id_card, room_id, move_in_date, occupants } = body;

        const result = await pool.query(
            'INSERT INTO tenants (name, phone, id_card, room_id, move_in_date, occupants) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, phone, id_card, room_id || null, move_in_date, occupants || 1]
        );

        // Update room status
        if (room_id) {
            await pool.query('UPDATE rooms SET status=$1 WHERE id=$2', ['occupied', room_id]);
        }

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating tenant:', error);
        return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, phone, id_card, room_id, move_in_date, move_out_date, is_active, occupants } = body;

        // Get old room_id
        const old = await pool.query('SELECT room_id FROM tenants WHERE id=$1', [id]);
        const oldRoomId = old.rows[0]?.room_id;

        const result = await pool.query(
            `UPDATE tenants SET name=$1, phone=$2, id_card=$3, room_id=$4, move_in_date=$5, move_out_date=$6, is_active=$7, occupants=$8 WHERE id=$9 RETURNING *`,
            [name, phone, id_card, room_id || null, move_in_date, move_out_date || null, is_active ?? true, occupants || 1, id]
        );

        // Update room statuses
        if (oldRoomId && oldRoomId !== room_id) {
            const tenantCount = await pool.query('SELECT COUNT(*) FROM tenants WHERE room_id=$1 AND is_active=true AND id!=$2', [oldRoomId, id]);
            if (parseInt(tenantCount.rows[0].count) === 0) {
                await pool.query('UPDATE rooms SET status=$1 WHERE id=$2', ['available', oldRoomId]);
            }
        }
        if (room_id) {
            await pool.query('UPDATE rooms SET status=$1 WHERE id=$2', ['occupied', room_id]);
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating tenant:', error);
        return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        const tenant = await pool.query('SELECT room_id FROM tenants WHERE id=$1', [id]);
        const roomId = tenant.rows[0]?.room_id;

        await pool.query('DELETE FROM tenants WHERE id=$1', [id]);

        if (roomId) {
            const remaining = await pool.query('SELECT COUNT(*) FROM tenants WHERE room_id=$1 AND is_active=true', [roomId]);
            if (parseInt(remaining.rows[0].count) === 0) {
                await pool.query('UPDATE rooms SET status=$1 WHERE id=$2', ['available', roomId]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting tenant:', error);
        return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 });
    }
}

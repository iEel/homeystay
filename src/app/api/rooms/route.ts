import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const result = await pool.query('SELECT * FROM rooms ORDER BY number');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { number, floor, monthly_rent, status } = body;

        // Validation
        if (!number || typeof number !== 'string' || !number.trim()) {
            return NextResponse.json({ error: 'กรุณาระบุหมายเลขห้อง' }, { status: 400 });
        }
        if (!floor || isNaN(Number(floor)) || Number(floor) < 1) {
            return NextResponse.json({ error: 'กรุณาระบุชั้นที่ถูกต้อง' }, { status: 400 });
        }
        if (!monthly_rent || isNaN(Number(monthly_rent)) || Number(monthly_rent) < 0) {
            return NextResponse.json({ error: 'กรุณาระบุค่าเช่าที่ถูกต้อง' }, { status: 400 });
        }
        const validStatuses = ['available', 'occupied', 'maintenance'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
        }

        const result = await pool.query(
            'INSERT INTO rooms (number, floor, monthly_rent, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [number.trim(), floor, monthly_rent, status || 'available']
        );
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, number, floor, monthly_rent, status } = body;

        if (!id) return NextResponse.json({ error: 'ไม่พบ ID ห้อง' }, { status: 400 });
        if (!number || typeof number !== 'string' || !number.trim()) {
            return NextResponse.json({ error: 'กรุณาระบุหมายเลขห้อง' }, { status: 400 });
        }
        if (!floor || isNaN(Number(floor)) || Number(floor) < 1) {
            return NextResponse.json({ error: 'กรุณาระบุชั้นที่ถูกต้อง' }, { status: 400 });
        }
        if (!monthly_rent || isNaN(Number(monthly_rent)) || Number(monthly_rent) < 0) {
            return NextResponse.json({ error: 'กรุณาระบุค่าเช่าที่ถูกต้อง' }, { status: 400 });
        }
        const validStatuses = ['available', 'occupied', 'maintenance'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
        }

        const result = await pool.query(
            'UPDATE rooms SET number=$1, floor=$2, monthly_rent=$3, status=$4 WHERE id=$5 RETURNING *',
            [number.trim(), floor, monthly_rent, status, id]
        );
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating room:', error);
        return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: 'กรุณาระบุ ID ห้องที่ถูกต้อง' }, { status: 400 });
        }

        // ตรวจว่าห้องไม่มีผู้เช่า active
        const activeTenants = await pool.query(
            'SELECT COUNT(*) FROM tenants WHERE room_id=$1 AND is_active=true',
            [id]
        );
        if (parseInt(activeTenants.rows[0].count) > 0) {
            return NextResponse.json({ error: 'ไม่สามารถลบห้องที่มีผู้เช่าอยู่ได้' }, { status: 400 });
        }

        await pool.query('DELETE FROM rooms WHERE id=$1', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting room:', error);
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
    }
}

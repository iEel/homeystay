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
        const result = await pool.query(
            'INSERT INTO rooms (number, floor, monthly_rent, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [number, floor, monthly_rent, status || 'available']
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
        const result = await pool.query(
            'UPDATE rooms SET number=$1, floor=$2, monthly_rent=$3, status=$4 WHERE id=$5 RETURNING *',
            [number, floor, monthly_rent, status, id]
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
        await pool.query('DELETE FROM rooms WHERE id=$1', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting room:', error);
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
    }
}

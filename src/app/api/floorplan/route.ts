import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET — ดึงตำแหน่งทั้งหมด
export async function GET() {
    try {
        const result = await pool.query(`
            SELECT fp.*, 
                CASE 
                    WHEN fp.item_type = 'room' THEN r.number
                    WHEN fp.item_type = 'bathroom' THEN b.name
                END as item_name,
                CASE 
                    WHEN fp.item_type = 'room' THEN r.status
                    ELSE NULL
                END as room_status,
                CASE 
                    WHEN fp.item_type = 'room' THEN r.floor
                    ELSE fp.floor
                END as item_floor
            FROM floor_plan_positions fp
            LEFT JOIN rooms r ON fp.item_type = 'room' AND fp.item_id = r.id
            LEFT JOIN bathrooms b ON fp.item_type = 'bathroom' AND fp.item_id = b.id
            ORDER BY fp.item_type, fp.item_id
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching floor plan:', error);
        return NextResponse.json({ error: 'Failed to fetch floor plan' }, { status: 500 });
    }
}

// PUT — บันทึก/อัพเดตตำแหน่ง
export async function PUT(request: Request) {
    try {
        const { positions } = await request.json();
        // positions = [{ item_type, item_id, pos_x, pos_y, floor, width, height }]

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const pos of positions) {
                await client.query(`
                    INSERT INTO floor_plan_positions (item_type, item_id, pos_x, pos_y, floor, width, height)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (item_type, item_id) 
                    DO UPDATE SET pos_x = $3, pos_y = $4, floor = $5, width = $6, height = $7
                `, [pos.item_type, pos.item_id, pos.pos_x, pos.pos_y, pos.floor, pos.width || 8, pos.height || 6]);
            }

            await client.query('COMMIT');
            return NextResponse.json({ success: true });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error saving floor plan:', error);
        return NextResponse.json({ error: 'Failed to save floor plan' }, { status: 500 });
    }
}

// DELETE — ลบตำแหน่ง (ย้ายกลับ sidebar)
export async function DELETE(request: Request) {
    try {
        const { item_type, item_id } = await request.json();
        await pool.query(
            'DELETE FROM floor_plan_positions WHERE item_type = $1 AND item_id = $2',
            [item_type, item_id]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting floor plan position:', error);
        return NextResponse.json({ error: 'Failed to delete position' }, { status: 500 });
    }
}

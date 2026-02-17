import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const result = await pool.query('SELECT * FROM settings ORDER BY key');
        const settings: Record<string, { value: string; label: string }> = {};
        result.rows.forEach((row: { key: string; value: string; label: string }) => {
            settings[row.key] = { value: row.value, label: row.label };
        });
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const entries = Object.entries(body) as [string, string][];

        for (const [key, value] of entries) {
            await pool.query('UPDATE settings SET value=$1 WHERE key=$2', [value, key]);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

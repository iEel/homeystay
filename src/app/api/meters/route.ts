import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        let meterQuery = 'SELECT mr.*, r.number as room_number FROM meter_readings mr JOIN rooms r ON mr.room_id = r.id';
        let sharedQuery = `
            SELECT sbr.*, b.name as bathroom_name
            FROM shared_bathroom_readings sbr
            JOIN bathrooms b ON sbr.bathroom_id = b.id
        `;
        const params: string[] = [];

        if (month) {
            meterQuery += ' WHERE mr.month = $1';
            sharedQuery += ' WHERE sbr.month = $1';
            params.push(month);
        }

        meterQuery += ' ORDER BY r.number';
        sharedQuery += ' ORDER BY b.id';

        const [meters, shared] = await Promise.all([
            pool.query(meterQuery, params),
            pool.query(sharedQuery, params),
        ]);

        // ดึงข้อมูลเดือนก่อนหน้า (เพื่อ auto-fill เลขก่อน)
        let prevMonthMeters: { rows: unknown[] } = { rows: [] };
        let prevMonthShared: { rows: unknown[] } = { rows: [] };

        // ดึงประวัติ 6 เดือนย้อนหลัง
        let historyMeters: { rows: unknown[] } = { rows: [] };
        let historyShared: { rows: unknown[] } = { rows: [] };

        if (month) {
            const [y, m] = month.split('-').map(Number);
            const prevDate = new Date(y, m - 2, 1);
            const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

            // 6 เดือนย้อนหลัง (ไม่รวมเดือนปัจจุบัน)
            const months6: string[] = [];
            for (let i = 1; i <= 6; i++) {
                const d = new Date(y, m - 1 - i, 1);
                months6.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
            }

            // Run all queries in parallel
            const [prevMetersResult, prevSharedResult, histMetersResult, histSharedResult] = await Promise.all([
                pool.query(
                    'SELECT room_id, electric_curr, water_faucet_curr FROM meter_readings WHERE month = $1',
                    [prevMonth]
                ),
                pool.query(
                    'SELECT bathroom_id, water_curr FROM shared_bathroom_readings WHERE month = $1',
                    [prevMonth]
                ),
                months6.length > 0
                    ? pool.query(
                        `SELECT room_id, month, electric_prev, electric_curr, water_faucet_prev, water_faucet_curr, 
                                override_electric_units, override_water_units
                         FROM meter_readings 
                         WHERE month = ANY($1) 
                         ORDER BY month DESC`,
                        [months6]
                    )
                    : { rows: [] },
                months6.length > 0
                    ? pool.query(
                        `SELECT bathroom_id, month, water_prev, water_curr, override_water_units
                         FROM shared_bathroom_readings 
                         WHERE month = ANY($1) 
                         ORDER BY month DESC`,
                        [months6]
                    )
                    : { rows: [] },
            ]);

            prevMonthMeters = prevMetersResult;
            prevMonthShared = prevSharedResult;
            historyMeters = histMetersResult;
            historyShared = histSharedResult;
        }

        return NextResponse.json({
            meters: meters.rows,
            shared: shared.rows,
            prevMonth: {
                meters: prevMonthMeters.rows,
                shared: prevMonthShared.rows,
            },
            history: {
                meters: historyMeters.rows,
                shared: historyShared.rows,
            },
        });
    } catch (error) {
        console.error('Error fetching meters:', error);
        return NextResponse.json({ error: 'Failed to fetch meters' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { readings, sharedReadings } = body;

        // Upsert meter readings per room (with override support)
        if (readings && readings.length > 0) {
            for (const r of readings) {
                const overrideE = r.override_electric_units != null && r.override_electric_units !== ''
                    ? parseFloat(r.override_electric_units) : null;
                const overrideW = r.override_water_units != null && r.override_water_units !== ''
                    ? parseFloat(r.override_water_units) : null;

                await pool.query(
                    `INSERT INTO meter_readings (room_id, month, electric_prev, electric_curr, water_faucet_prev, water_faucet_curr, override_electric_units, override_water_units)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (room_id, month) DO UPDATE SET
             electric_prev = $3, electric_curr = $4,
             water_faucet_prev = $5, water_faucet_curr = $6,
             override_electric_units = $7, override_water_units = $8`,
                    [r.room_id, r.month, r.electric_prev, r.electric_curr, r.water_faucet_prev, r.water_faucet_curr, overrideE, overrideW]
                );
            }
        }

        // Upsert shared bathroom readings (with override support)
        if (sharedReadings && sharedReadings.length > 0) {
            for (const s of sharedReadings) {
                const overrideW = s.override_water_units != null && s.override_water_units !== ''
                    ? parseFloat(s.override_water_units) : null;

                await pool.query(
                    `INSERT INTO shared_bathroom_readings (bathroom_id, month, water_prev, water_curr, override_water_units)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (bathroom_id, month) DO UPDATE SET water_prev = $3, water_curr = $4, override_water_units = $5`,
                    [s.bathroom_id, s.month, s.water_prev, s.water_curr, overrideW]
                );
            }
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Error saving meters:', error);
        return NextResponse.json({ error: 'Failed to save meters' }, { status: 500 });
    }
}

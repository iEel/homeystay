import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { calcMeterUnits } from '@/lib/meter';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        let query = `
      SELECT i.*, r.number as room_number
      FROM invoices i
      JOIN rooms r ON i.room_id = r.id
    `;
        const params: string[] = [];

        if (month) {
            query += ' WHERE i.month = $1';
            params.push(month);
        }

        query += ' ORDER BY r.number';

        const result = await pool.query(query, params);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

// สร้างบิลสำหรับเดือนที่เลือก
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { month } = body;

        // ดึงอัตราค่าไฟ/น้ำจาก settings
        const settingsResult = await pool.query('SELECT * FROM settings');
        const settings: Record<string, number> = {};
        settingsResult.rows.forEach((row: { key: string; value: string }) => {
            settings[row.key] = parseFloat(row.value);
        });

        const electricRate = settings['electric_rate'] || 8;
        const waterRate = settings['water_rate'] || 18;
        const electricExtraUnits = settings['electric_extra_units'] || 0;
        const waterExtraUnits = settings['water_extra_units'] || 0;

        // ดึงห้องที่มีผู้เช่า
        const rooms = await pool.query(`
      SELECT r.* FROM rooms r
      WHERE r.status = 'occupied'
    `);

        // ดึงมิเตอร์ของเดือนนี้
        const meters = await pool.query(
            'SELECT * FROM meter_readings WHERE month = $1',
            [month]
        );
        const meterMap = new Map(meters.rows.map((m: { room_id: number }) => [m.room_id, m]));

        // ดึงมิเตอร์เดือนก่อน (ใช้เป็น prev เหมือนหน้าจดมิเตอร์)
        const [y, mo] = month.split('-').map(Number);
        const prevDate = new Date(y, mo - 2, 1);
        const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

        const prevMeters = await pool.query(
            'SELECT room_id, electric_curr, water_faucet_curr FROM meter_readings WHERE month = $1',
            [prevMonth]
        );
        const prevMeterMap = new Map(prevMeters.rows.map((m: { room_id: number }) => [m.room_id, m]));

        const prevSharedReadings = await pool.query(
            'SELECT bathroom_id, water_curr FROM shared_bathroom_readings WHERE month = $1',
            [prevMonth]
        );
        const prevSharedMap = new Map(prevSharedReadings.rows.map((s: { bathroom_id: number }) => [s.bathroom_id, s]));

        // ดึงห้องน้ำทั้งหมด + mapping + readings
        const bathroomReadings = await pool.query(
            'SELECT * FROM shared_bathroom_readings WHERE month = $1',
            [month]
        );
        const bathroomMappings = await pool.query(`
            SELECT br.bathroom_id, br.room_id, COALESCE(t.occupants, 1) as occupants
            FROM bathroom_rooms br
            JOIN rooms r ON br.room_id = r.id
            LEFT JOIN tenants t ON t.room_id = r.id AND t.is_active = true
            WHERE r.status = 'occupied'
        `);

        // คำนวณค่าน้ำห้องน้ำรวมต่อห้องพัก (per bathroom)
        // สร้าง map: room_id -> รวมค่าน้ำจากทุกห้องน้ำที่ assign
        const roomSharedCost: Record<number, number> = {};

        for (const reading of bathroomReadings.rows) {
            const bathroomId = reading.bathroom_id;
            // ใช้ override ถ้ามี ไม่งั้นคำนวณจาก prev month curr → current month curr
            let sharedUnits: number;
            if (reading.override_water_units != null) {
                sharedUnits = parseFloat(reading.override_water_units);
            } else {
                const prevShared = prevSharedMap.get(bathroomId) as { water_curr: string } | undefined;
                const prevVal = prevShared ? parseFloat(prevShared.water_curr) : 0;
                const currVal = parseFloat(reading.water_curr);
                sharedUnits = calcMeterUnits(prevVal, currVal);
            }
            const sharedTotalCost = sharedUnits * waterRate;

            // หา occupants ของห้องพักที่ใช้ห้องน้ำนี้
            const assignedRooms = bathroomMappings.rows.filter(
                (m: { bathroom_id: number }) => m.bathroom_id === bathroomId
            );
            const totalOccupants = assignedRooms.reduce(
                (sum: number, m: { occupants: number }) => sum + (m.occupants || 1), 0
            );

            if (totalOccupants > 0) {
                const costPerPerson = sharedTotalCost / totalOccupants;

                // แจกค่าน้ำให้แต่ละห้องตาม occupants
                for (const mapping of assignedRooms) {
                    const roomId = mapping.room_id;
                    const roomOccupants = mapping.occupants || 1;
                    const roomCost = costPerPerson * roomOccupants;

                    roomSharedCost[roomId] = (roomSharedCost[roomId] || 0) + roomCost;
                }
            }
        }

        const invoices = [];

        for (const room of rooms.rows) {
            const meter = meterMap.get(room.id) as {
                electric_curr: string;
                water_faucet_curr: string;
                override_electric_units: string | null;
                override_water_units: string | null;
            } | undefined;

            // ดึง prev จากเดือนก่อน (เหมือนหน้าจดมิเตอร์)
            const prevMeter = prevMeterMap.get(room.id) as {
                electric_curr: string;
                water_faucet_curr: string;
            } | undefined;

            // ใช้ override ถ้ามี ไม่งั้นคำนวณ: (prev month curr → current month curr) + หน่วยเพิ่ม
            let electricUnits = 0;
            if (meter) {
                if (meter.override_electric_units != null) {
                    electricUnits = parseFloat(meter.override_electric_units);
                } else {
                    const ePrev = prevMeter ? parseFloat(prevMeter.electric_curr) : 0;
                    const eCurr = parseFloat(meter.electric_curr);
                    const rawUnits = calcMeterUnits(ePrev, eCurr);
                    electricUnits = rawUnits > 0 ? rawUnits + electricExtraUnits : 0;
                }
            }
            const electricCost = electricUnits * electricRate;

            let waterFaucetUnits = 0;
            if (meter) {
                if (meter.override_water_units != null) {
                    waterFaucetUnits = parseFloat(meter.override_water_units);
                } else {
                    const wPrev = prevMeter ? parseFloat(prevMeter.water_faucet_curr) : 0;
                    const wCurr = parseFloat(meter.water_faucet_curr);
                    const rawUnits = calcMeterUnits(wPrev, wCurr);
                    waterFaucetUnits = rawUnits > 0 ? rawUnits + waterExtraUnits : 0;
                }
            }
            const waterFaucetCost = waterFaucetUnits * waterRate;

            const sharedCost = roomSharedCost[room.id] || 0;

            const totalAmount = parseFloat(room.monthly_rent) + electricCost + waterFaucetCost + sharedCost;

            const result = await pool.query(
                `INSERT INTO invoices (room_id, month, rent, electric_units, electric_cost, water_faucet_units, water_faucet_cost, water_shared_cost, total_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (room_id, month) DO UPDATE SET
           rent=$3, electric_units=$4, electric_cost=$5,
           water_faucet_units=$6, water_faucet_cost=$7,
           water_shared_cost=$8, total_amount=$9
         RETURNING *`,
                [room.id, month, room.monthly_rent, electricUnits, electricCost, waterFaucetUnits, waterFaucetCost, sharedCost, totalAmount]
            );
            invoices.push(result.rows[0]);
        }

        return NextResponse.json(invoices, { status: 201 });
    } catch (error) {
        console.error('Error creating invoices:', error);
        return NextResponse.json({ error: 'Failed to create invoices' }, { status: 500 });
    }
}

// อัปเดตสถานะบิล (ชำระ/ค้าง)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;
        const result = await pool.query(
            'UPDATE invoices SET status=$1 WHERE id=$2 RETURNING *',
            [status, id]
        );
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }
}

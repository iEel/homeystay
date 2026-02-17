'use client';

import { useEffect, useState, useRef } from 'react';
import { Gauge, Zap, Droplets, Save, ShowerHead, History, Pencil, X, ChevronLeft, ChevronRight, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import { nowBangkok, currentMonthBangkok } from '@/lib/timezone';
import { calcMeterUnits, isRollover } from '@/lib/meter';

interface Room {
    id: number;
    number: string;
    status: string;
}

interface MeterReading {
    room_id: number;
    room_number: string;
    electric_prev: number;
    electric_curr: number;
    water_faucet_prev: number;
    water_faucet_curr: number;
    override_electric_units: number | null;
    override_water_units: number | null;
}

interface Bathroom {
    id: number;
    name: string;
    rooms: { room_id: number; room_number: string }[];
}

interface SharedReading {
    bathroom_id: number;
    water_prev: number;
    water_curr: number;
    override_water_units: number | null;
}

interface PrevMeterData {
    room_id: number;
    electric_curr: number;
    water_faucet_curr: number;
}

interface PrevSharedData {
    bathroom_id: number;
    water_curr: number;
}

interface HistoryMeterRow {
    room_id: number;
    month: string;
    electric_prev: string;
    electric_curr: string;
    water_faucet_prev: string;
    water_faucet_curr: string;
    override_electric_units: string | null;
    override_water_units: string | null;
}

interface HistorySharedRow {
    bathroom_id: number;
    month: string;
    water_prev: string;
    water_curr: string;
    override_water_units: string | null;
}

interface RoomReadingState {
    electric_prev: string;
    electric_curr: string;
    water_faucet_prev: string;
    water_faucet_curr: string;
    override_electric_units: string;
    override_water_units: string;
}

interface SharedReadingState {
    water_prev: string;
    water_curr: string;
    override_water_units: string;
}

export default function MetersPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [readings, setReadings] = useState<Record<number, RoomReadingState>>({});
    const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
    const [sharedReadings, setSharedReadings] = useState<Record<number, SharedReadingState>>({});
    const [month, setMonth] = useState(() => currentMonthBangkok());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tenants, setTenants] = useState<{ room_id: number; occupants: number; is_active: boolean }[]>([]);
    const [electricExtraUnits, setElectricExtraUnits] = useState(0);
    const [waterExtraUnits, setWaterExtraUnits] = useState(0);
    const [electricAlertUnits, setElectricAlertUnits] = useState(100);
    const [waterAlertUnits, setWaterAlertUnits] = useState(100);

    // History
    const [historyMeters, setHistoryMeters] = useState<HistoryMeterRow[]>([]);
    const [historyShared, setHistoryShared] = useState<HistorySharedRow[]>([]);
    const [historyModal, setHistoryModal] = useState<{ type: 'room' | 'bathroom'; id: number; name: string } | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(() => parseInt(month.split('-')[0]));
    const pickerRef = useRef<HTMLDivElement>(null);

    const fetchData = async (silentRefresh = false) => {
        if (!silentRefresh) setLoading(true);
        const [roomsRes, metersRes, bathroomsRes, tenantsRes, settingsRes] = await Promise.all([
            fetch('/api/rooms').then(r => r.json()),
            fetch(`/api/meters?month=${month}`).then(r => r.json()),
            fetch('/api/bathrooms').then(r => r.json()),
            fetch('/api/tenants').then(r => r.json()),
            fetch('/api/settings').then(r => r.json()),
        ]);

        // Parse extra units from settings
        if (settingsRes && typeof settingsRes === 'object') {
            setElectricExtraUnits(parseFloat(settingsRes.electric_extra_units?.value) || 0);
            setWaterExtraUnits(parseFloat(settingsRes.water_extra_units?.value) || 0);
            setElectricAlertUnits(parseFloat(settingsRes.electric_alert_units?.value) || 100);
            setWaterAlertUnits(parseFloat(settingsRes.water_alert_units?.value) || 100);
        }

        const roomList = Array.isArray(roomsRes) ? roomsRes : [];
        setRooms(roomList);

        const bathroomList = Array.isArray(bathroomsRes) ? bathroomsRes : [];
        setBathrooms(bathroomList);

        const tenantList = Array.isArray(tenantsRes) ? tenantsRes : [];
        setTenants(tenantList);

        // Current month data
        const meterList = Array.isArray(metersRes.meters) ? metersRes.meters : [];
        const meterMap: Record<number, MeterReading> = {};
        meterList.forEach((m: MeterReading) => { meterMap[m.room_id] = m; });

        // Previous month data
        const prevMeters: PrevMeterData[] = metersRes.prevMonth?.meters || [];
        const prevMeterMap: Record<number, PrevMeterData> = {};
        prevMeters.forEach((m: PrevMeterData) => { prevMeterMap[m.room_id] = m; });

        const prevShared: PrevSharedData[] = metersRes.prevMonth?.shared || [];
        const prevSharedMap: Record<number, PrevSharedData> = {};
        prevShared.forEach((s: PrevSharedData) => { prevSharedMap[s.bathroom_id] = s; });

        // History data
        setHistoryMeters(metersRes.history?.meters || []);
        setHistoryShared(metersRes.history?.shared || []);

        // Helpers
        const cleanPrev = (val: unknown): string => {
            const n = parseFloat(String(val));
            if (isNaN(n)) return '0';
            return n % 1 === 0 ? String(Math.floor(n)) : String(n);
        };
        const cleanCurr = (val: unknown, hasRecord: boolean): string => {
            const n = parseFloat(String(val));
            if (isNaN(n)) return '';
            if (n === 0 && !hasRecord) return '';
            return n % 1 === 0 ? String(Math.floor(n)) : String(n);
        };
        const cleanOverride = (val: unknown): string => {
            if (val == null) return '';
            const n = parseFloat(String(val));
            if (isNaN(n)) return '';
            return n % 1 === 0 ? String(Math.floor(n)) : String(n);
        };

        // Initialize room readings
        const initReadings: Record<number, RoomReadingState> = {};
        roomList.forEach((room: Room) => {
            const existing = meterMap[room.id];
            const prev = prevMeterMap[room.id];

            initReadings[room.id] = {
                electric_prev: cleanPrev(prev?.electric_curr),
                electric_curr: existing ? cleanCurr(existing.electric_curr, true) : '',
                water_faucet_prev: cleanPrev(prev?.water_faucet_curr),
                water_faucet_curr: existing ? cleanCurr(existing.water_faucet_curr, true) : '',
                override_electric_units: existing ? cleanOverride(existing.override_electric_units) : '',
                override_water_units: existing ? cleanOverride(existing.override_water_units) : '',
            };
        });
        setReadings(initReadings);

        // Initialize shared bathroom readings
        const sharedList = Array.isArray(metersRes.shared) ? metersRes.shared : [];
        const sharedMap: Record<number, SharedReading> = {};
        sharedList.forEach((s: SharedReading) => { sharedMap[s.bathroom_id] = s; });

        const initShared: Record<number, SharedReadingState> = {};
        bathroomList.forEach((b: Bathroom) => {
            const existing = sharedMap[b.id];
            const prev = prevSharedMap[b.id];

            initShared[b.id] = {
                water_prev: cleanPrev(prev?.water_curr),
                water_curr: existing ? cleanCurr(existing.water_curr, true) : '',
                override_water_units: existing ? cleanOverride(existing.override_water_units) : '',
            };
        });
        setSharedReadings(initShared);

        if (!silentRefresh) setLoading(false);
    };

    useEffect(() => { fetchData(); }, [month]);

    const updateReading = (roomId: number, field: string, value: string) => {
        setReadings(prev => ({
            ...prev,
            [roomId]: { ...prev[roomId], [field]: value }
        }));
    };

    const updateSharedReading = (bathroomId: number, field: string, value: string) => {
        setSharedReadings(prev => ({
            ...prev,
            [bathroomId]: { ...prev[bathroomId], [field]: value }
        }));
    };

    const getOccupantsForBathroom = (bathroom: Bathroom) => {
        return bathroom.rooms.reduce((total, r) => {
            const tenant = tenants.find(t => t.room_id === r.room_id && t.is_active);
            return total + (tenant ? (tenant.occupants || 1) : 0);
        }, 0);
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            // เฉพาะห้องที่มีการกรอกเลขปัจจุบัน (ไม่ส่งห้องที่ยังว่าง → ไม่ overwrite ข้อมูลเดิม)
            const meterData = Object.entries(readings)
                .filter(([, data]) => data.electric_curr !== '' || data.water_faucet_curr !== '')
                .map(([roomId, data]) => ({
                    room_id: parseInt(roomId),
                    month,
                    electric_prev: parseFloat(data.electric_prev) || 0,
                    electric_curr: parseFloat(data.electric_curr) || 0,
                    water_faucet_prev: parseFloat(data.water_faucet_prev) || 0,
                    water_faucet_curr: parseFloat(data.water_faucet_curr) || 0,
                    override_electric_units: data.override_electric_units || null,
                    override_water_units: data.override_water_units || null,
                }));

            // เฉพาะห้องน้ำที่มีการกรอกเลขปัจจุบัน
            const sharedData = Object.entries(sharedReadings)
                .filter(([, data]) => data.water_curr !== '')
                .map(([bathroomId, data]) => ({
                    bathroom_id: parseInt(bathroomId),
                    month,
                    water_prev: parseFloat(data.water_prev) || 0,
                    water_curr: parseFloat(data.water_curr) || 0,
                    override_water_units: data.override_water_units || null,
                }));

            const res = await fetch('/api/meters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    readings: meterData,
                    sharedReadings: sharedData,
                }),
            });

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }

            // โหลดข้อมูลใหม่หลังบันทึก (silent — ไม่แสดง loading spinner)
            await fetchData(true);
            setSaving(false);
            setToast('บันทึกข้อมูลมิเตอร์เรียบร้อย ✅');
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error('Save error:', err);
            setSaving(false);
            setToast('❌ บันทึกไม่สำเร็จ กรุณาลองใหม่');
            setTimeout(() => setToast(null), 5000);
        }
    };

    // Format month label
    const monthLabel = (m: string) => {
        const [y, mo] = m.split('-');
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        return `${months[parseInt(mo) - 1]} ${y}`;
    };

    // Get history for a room
    const getRoomHistory = (roomId: number) => {
        return historyMeters
            .filter((h: HistoryMeterRow) => h.room_id === roomId)
            .sort((a: HistoryMeterRow, b: HistoryMeterRow) => b.month.localeCompare(a.month));
    };

    // Get history for a bathroom
    const getBathroomHistory = (bathroomId: number) => {
        return historyShared
            .filter((h: HistorySharedRow) => h.bathroom_id === bathroomId)
            .sort((a: HistorySharedRow, b: HistorySharedRow) => b.month.localeCompare(a.month));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">จดมิเตอร์</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">บันทึกค่าไฟฟ้าและค่าน้ำประจำเดือน — กรอกเฉพาะ <strong>เลขปัจจุบัน</strong></p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Custom month selector */}
                    <div className="relative" ref={pickerRef}>
                        <div className="flex items-center gap-1 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200/60 rounded-xl px-1.5 py-1">
                            <button
                                onClick={() => {
                                    const [y, m] = month.split('-').map(Number);
                                    const d = new Date(y, m - 2, 1);
                                    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                                    setPickerYear(d.getFullYear());
                                }}
                                className="p-2 rounded-lg hover:bg-white/80 text-indigo-500 hover:text-indigo-700 cursor-pointer transition-colors"
                                title="เดือนก่อน"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => { setPickerYear(parseInt(month.split('-')[0])); setPickerOpen(prev => !prev); }}
                                className="flex items-center gap-2 px-3 py-1.5 min-w-[180px] justify-center cursor-pointer hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <Calendar size={16} className="text-indigo-400" />
                                <span className="font-semibold text-indigo-700">
                                    {(() => {
                                        const [y, m] = month.split('-').map(Number);
                                        const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
                                        return `${thaiMonths[m - 1]} ${y + 543}`;
                                    })()}
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    const [y, m] = month.split('-').map(Number);
                                    const d = new Date(y, m, 1);
                                    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                                    setPickerYear(d.getFullYear());
                                }}
                                className="p-2 rounded-lg hover:bg-white/80 text-indigo-500 hover:text-indigo-700 cursor-pointer transition-colors"
                                title="เดือนถัดไป"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Month picker dropdown */}
                        {pickerOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                                <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-[280px] animate-[scaleIn_0.15s_ease-out]">
                                    {/* Year header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <button
                                            onClick={() => setPickerYear(prev => prev - 1)}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="font-bold text-gray-800 text-lg">พ.ศ. {pickerYear + 543}</span>
                                        <button
                                            onClick={() => setPickerYear(prev => prev + 1)}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    {/* Month grid 4x3 */}
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map((label, idx) => {
                                            const mNum = idx + 1;
                                            const selectedMonth = parseInt(month.split('-')[1]);
                                            const selectedYear = parseInt(month.split('-')[0]);
                                            const isSelected = pickerYear === selectedYear && mNum === selectedMonth;
                                            const now = nowBangkok();
                                            const isCurrent = pickerYear === now.getFullYear() && mNum === now.getMonth() + 1;
                                            return (
                                                <button
                                                    key={mNum}
                                                    onClick={() => {
                                                        setMonth(`${pickerYear}-${String(mNum).padStart(2, '0')}`);
                                                        setPickerOpen(false);
                                                    }}
                                                    className={`relative py-2 px-1 rounded-xl text-sm font-medium cursor-pointer transition-all ${isSelected
                                                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                                                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                                        }`}
                                                >
                                                    {label}
                                                    {isCurrent && !isSelected && (
                                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 disabled:opacity-50 cursor-pointer"
                    >
                        <Save size={18} />
                        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </div>

            {/* Per-room meter readings */}
            <div className="space-y-4 mb-8">
                {rooms.map((room, i) => {
                    const r = readings[room.id];
                    if (!r) return null;
                    const prevE = parseFloat(r.electric_prev) || 0;
                    const currE = parseFloat(r.electric_curr) || 0;
                    const rawElectricUnits = currE > 0 ? calcMeterUnits(prevE, currE) : 0;
                    const electricUnits = rawElectricUnits > 0 ? rawElectricUnits + electricExtraUnits : 0;
                    const hasElectricOverride = r.override_electric_units !== '';
                    const electricRollover = isRollover(prevE, currE);
                    const electricHighUsage = rawElectricUnits > electricAlertUnits;

                    const prevW = parseFloat(r.water_faucet_prev) || 0;
                    const currW = parseFloat(r.water_faucet_curr) || 0;
                    const rawWaterUnits = currW > 0 ? calcMeterUnits(prevW, currW) : 0;
                    const waterUnits = rawWaterUnits > 0 ? rawWaterUnits + waterExtraUnits : 0;
                    const hasWaterOverride = r.override_water_units !== '';
                    const waterRollover = isRollover(prevW, currW);
                    const waterHighUsage = rawWaterUnits > waterAlertUnits;

                    const roomHistory = getRoomHistory(room.id);

                    return (
                        <div
                            key={room.id}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border)] animate-fade-in"
                            style={{ animationDelay: `${i * 30}ms` }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <Gauge size={20} className="text-indigo-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-[var(--color-text)]">ห้อง {room.number}</h3>
                                    <span className={`text-xs ${room.status === 'occupied' ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {room.status === 'occupied' ? 'มีผู้เช่า' : room.status === 'available' ? 'ว่าง' : 'ซ่อมบำรุง'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setHistoryModal({ type: 'room', id: room.id, name: `ห้อง ${room.number}` })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors"
                                    title="ดูประวัติย้อนหลัง"
                                >
                                    <History size={14} />
                                    ประวัติ
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* ค่าไฟ */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                                        <Zap size={16} />
                                        ค่าไฟฟ้า
                                        {electricRollover && !hasElectricOverride && (
                                            <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} /> มิเตอร์วนรอบ
                                            </span>
                                        )}
                                        {currE > 0 && !hasElectricOverride && (
                                            <span className="ml-auto text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                                                {rawElectricUnits}{electricExtraUnits > 0 ? ` +${electricExtraUnits}` : ''} = {electricUnits} หน่วย
                                            </span>
                                        )}
                                        {electricHighUsage && !hasElectricOverride && !electricRollover && (
                                            <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} /> ใช้เกิน {electricAlertUnits} หน่วย!
                                            </span>
                                        )}
                                        {hasElectricOverride && (
                                            <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                                                ⚠️ ปรับเอง {r.override_electric_units} หน่วย
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">เลขเดือนก่อน</label>
                                            <div className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-500 rounded-lg font-mono">
                                                {r.electric_prev || '0'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-indigo-600 font-semibold mb-1 block">เลขปัจจุบัน ✏️</label>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                value={r.electric_curr}
                                                onChange={e => updateReading(room.id, 'electric_curr', e.target.value)}
                                                placeholder="กรอกตัวเลข"
                                                className="w-full px-3 py-2 text-sm border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-indigo-50/30"
                                            />
                                        </div>
                                    </div>
                                    {/* Override ไฟ */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateReading(room.id, 'override_electric_units', hasElectricOverride ? '' : String(electricUnits))}
                                            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg cursor-pointer transition-colors ${hasElectricOverride ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            <Pencil size={12} />
                                            {hasElectricOverride ? 'ยกเลิกปรับเอง' : 'ปรับหน่วยเอง'}
                                        </button>
                                        {hasElectricOverride && (
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                value={r.override_electric_units}
                                                onChange={e => updateReading(room.id, 'override_electric_units', e.target.value)}
                                                placeholder="หน่วย"
                                                className="w-24 px-2 py-1 text-sm border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 bg-orange-50"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* ก๊อกน้ำ */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-cyan-600">
                                        <Droplets size={16} />
                                        ก๊อกน้ำประจำห้อง
                                        {waterRollover && !hasWaterOverride && (
                                            <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} /> มิเตอร์วนรอบ
                                            </span>
                                        )}
                                        {currW > 0 && !hasWaterOverride && (
                                            <span className="ml-auto text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full">
                                                {rawWaterUnits}{waterExtraUnits > 0 ? ` +${waterExtraUnits}` : ''} = {waterUnits} หน่วย
                                            </span>
                                        )}
                                        {waterHighUsage && !hasWaterOverride && !waterRollover && (
                                            <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} /> ใช้เกิน {waterAlertUnits} หน่วย!
                                            </span>
                                        )}
                                        {hasWaterOverride && (
                                            <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                                                ⚠️ ปรับเอง {r.override_water_units} หน่วย
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">เลขเดือนก่อน</label>
                                            <div className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-500 rounded-lg font-mono">
                                                {r.water_faucet_prev || '0'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-indigo-600 font-semibold mb-1 block">เลขปัจจุบัน ✏️</label>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                value={r.water_faucet_curr}
                                                onChange={e => updateReading(room.id, 'water_faucet_curr', e.target.value)}
                                                placeholder="กรอกตัวเลข"
                                                className="w-full px-3 py-2 text-sm border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-indigo-50/30"
                                            />
                                        </div>
                                    </div>
                                    {/* Override น้ำ */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateReading(room.id, 'override_water_units', hasWaterOverride ? '' : String(waterUnits))}
                                            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg cursor-pointer transition-colors ${hasWaterOverride ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            <Pencil size={12} />
                                            {hasWaterOverride ? 'ยกเลิกปรับเอง' : 'ปรับหน่วยเอง'}
                                        </button>
                                        {hasWaterOverride && (
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                value={r.override_water_units}
                                                onChange={e => updateReading(room.id, 'override_water_units', e.target.value)}
                                                placeholder="หน่วย"
                                                className="w-24 px-2 py-1 text-sm border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 bg-orange-50"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Inline mini history */}
                            {roomHistory.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-100">
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {roomHistory.slice(0, 4).map((h) => {
                                            const eUnits = h.override_electric_units != null ? parseFloat(h.override_electric_units) : parseFloat(h.electric_curr) - parseFloat(h.electric_prev);
                                            const wUnits = h.override_water_units != null ? parseFloat(h.override_water_units) : parseFloat(h.water_faucet_curr) - parseFloat(h.water_faucet_prev);
                                            return (
                                                <div key={h.month} className="flex-shrink-0 px-3 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-500">
                                                    <span className="font-medium text-gray-700">{monthLabel(h.month)}</span>
                                                    <span className="ml-2">⚡{Math.max(eUnits, 0)}</span>
                                                    <span className="ml-1.5">💧{Math.max(wUnits, 0)}</span>
                                                    {(h.override_electric_units != null || h.override_water_units != null) && (
                                                        <span className="ml-1 text-orange-500">✏️</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Shared bathrooms */}
            {bathrooms.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                        <ShowerHead size={22} className="text-cyan-600" />
                        ห้องน้ำรวม
                    </h2>
                    {bathrooms.map((bathroom, i) => {
                        const sr = sharedReadings[bathroom.id];
                        if (!sr) return null;
                        const prevVal = parseFloat(sr.water_prev) || 0;
                        const currVal = parseFloat(sr.water_curr) || 0;
                        const units = currVal > 0 ? calcMeterUnits(prevVal, currVal) : 0;
                        const sharedRollover = isRollover(prevVal, currVal);
                        const occupants = getOccupantsForBathroom(bathroom);
                        const hasOverride = sr.override_water_units !== '';
                        const bathroomHistory = getBathroomHistory(bathroom.id);

                        return (
                            <div
                                key={bathroom.id}
                                className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 shadow-sm border border-cyan-200 animate-fade-in"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                                        <ShowerHead size={20} className="text-cyan-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-[var(--color-text)]">{bathroom.name}</h3>
                                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                            {bathroom.rooms.length === 0 ? (
                                                <span className="text-xs text-gray-400 italic">ยังไม่ได้กำหนดห้องพัก</span>
                                            ) : (
                                                <>
                                                    {bathroom.rooms.map(r => (
                                                        <span key={r.room_id} className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
                                                            ห้อง {r.room_number}
                                                        </span>
                                                    ))}
                                                    <span className="text-xs text-[var(--color-text-muted)]">
                                                        ({occupants} คน)
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {sharedRollover && !hasOverride && (
                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} /> มิเตอร์วนรอบ
                                            </span>
                                        )}
                                        {currVal > 0 && !hasOverride && (
                                            <span className="text-xs bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full font-medium">
                                                {units} หน่วย
                                            </span>
                                        )}
                                        {hasOverride && (
                                            <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">
                                                ⚠️ ปรับเอง {sr.override_water_units} หน่วย
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setHistoryModal({ type: 'bathroom', id: bathroom.id, name: bathroom.name })}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-600 bg-cyan-100 hover:bg-cyan-200 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <History size={14} />
                                            ประวัติ
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 max-w-md">
                                    <div>
                                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">เลขเดือนก่อน</label>
                                        <div className="w-full px-4 py-2.5 bg-white/60 text-gray-500 rounded-xl font-mono text-sm border border-cyan-100">
                                            {sr.water_prev || '0'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-indigo-600 font-semibold mb-1 block">เลขปัจจุบัน ✏️</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={sr.water_curr}
                                            onChange={e => updateSharedReading(bathroom.id, 'water_curr', e.target.value)}
                                            placeholder="กรอกตัวเลข"
                                            className="w-full px-4 py-2.5 border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-500 bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Override น้ำรวม */}
                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        onClick={() => updateSharedReading(bathroom.id, 'override_water_units', hasOverride ? '' : String(units))}
                                        className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg cursor-pointer transition-colors ${hasOverride ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-white/70 text-gray-500 hover:bg-white'}`}
                                    >
                                        <Pencil size={12} />
                                        {hasOverride ? 'ยกเลิกปรับเอง' : 'ปรับหน่วยเอง'}
                                    </button>
                                    {hasOverride && (
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={sr.override_water_units}
                                            onChange={e => updateSharedReading(bathroom.id, 'override_water_units', e.target.value)}
                                            placeholder="หน่วย"
                                            className="w-24 px-2 py-1 text-sm border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/30 bg-orange-50"
                                        />
                                    )}
                                </div>

                                {/* Inline mini history */}
                                {bathroomHistory.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-cyan-200/50">
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {bathroomHistory.slice(0, 4).map((h) => {
                                                const wUnits = h.override_water_units != null ? parseFloat(h.override_water_units) : parseFloat(h.water_curr) - parseFloat(h.water_prev);
                                                return (
                                                    <div key={h.month} className="flex-shrink-0 px-3 py-1.5 bg-white/60 rounded-lg text-xs text-gray-500">
                                                        <span className="font-medium text-gray-700">{monthLabel(h.month)}</span>
                                                        <span className="ml-2">💧{Math.max(wUnits, 0)}</span>
                                                        {h.override_water_units != null && <span className="ml-1 text-orange-500">✏️</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {bathrooms.length === 0 && (
                <div className="bg-gray-50 rounded-2xl p-8 text-center text-[var(--color-text-muted)]">
                    <ShowerHead size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">ยังไม่มีห้องน้ำรวม กรุณาเพิ่มในหน้า ตั้งค่า</p>
                </div>
            )}

            {/* History Modal */}
            {historyModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setHistoryModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                                <History size={20} className="text-indigo-500" />
                                ประวัติ {historyModal.name}
                            </h3>
                            <button onClick={() => setHistoryModal(null)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5">
                            {historyModal.type === 'room' ? (
                                (() => {
                                    const data = getRoomHistory(historyModal.id);
                                    if (data.length === 0) return <p className="text-gray-400 text-sm text-center py-8">ยังไม่มีประวัติ</p>;
                                    return (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-500 border-b">
                                                    <th className="py-2 pr-2">เดือน</th>
                                                    <th className="py-2 px-2 text-center">⚡ ไฟ (หน่วย)</th>
                                                    <th className="py-2 px-2 text-center">💧 น้ำ (หน่วย)</th>
                                                    <th className="py-2 pl-2 text-center">หมายเหตุ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((h) => {
                                                    const eUnits = h.override_electric_units != null ? parseFloat(h.override_electric_units) : parseFloat(h.electric_curr) - parseFloat(h.electric_prev);
                                                    const wUnits = h.override_water_units != null ? parseFloat(h.override_water_units) : parseFloat(h.water_faucet_curr) - parseFloat(h.water_faucet_prev);
                                                    const hasOvr = h.override_electric_units != null || h.override_water_units != null;
                                                    return (
                                                        <tr key={h.month} className="border-b border-gray-50 hover:bg-gray-50">
                                                            <td className="py-2.5 pr-2 font-medium">{monthLabel(h.month)}</td>
                                                            <td className={`py-2.5 px-2 text-center font-mono ${h.override_electric_units != null ? 'text-orange-600 font-semibold' : ''}`}>
                                                                {Math.max(eUnits, 0)}
                                                            </td>
                                                            <td className={`py-2.5 px-2 text-center font-mono ${h.override_water_units != null ? 'text-orange-600 font-semibold' : ''}`}>
                                                                {Math.max(wUnits, 0)}
                                                            </td>
                                                            <td className="py-2.5 pl-2 text-center">
                                                                {hasOvr && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">ปรับเอง</span>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    );
                                })()
                            ) : (
                                (() => {
                                    const data = getBathroomHistory(historyModal.id);
                                    if (data.length === 0) return <p className="text-gray-400 text-sm text-center py-8">ยังไม่มีประวัติ</p>;
                                    return (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-500 border-b">
                                                    <th className="py-2 pr-2">เดือน</th>
                                                    <th className="py-2 px-2 text-center">💧 น้ำ (หน่วย)</th>
                                                    <th className="py-2 pl-2 text-center">หมายเหตุ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((h) => {
                                                    const wUnits = h.override_water_units != null ? parseFloat(h.override_water_units) : parseFloat(h.water_curr) - parseFloat(h.water_prev);
                                                    return (
                                                        <tr key={h.month} className="border-b border-gray-50 hover:bg-gray-50">
                                                            <td className="py-2.5 pr-2 font-medium">{monthLabel(h.month)}</td>
                                                            <td className={`py-2.5 px-2 text-center font-mono ${h.override_water_units != null ? 'text-orange-600 font-semibold' : ''}`}>
                                                                {Math.max(wUnits, 0)}
                                                            </td>
                                                            <td className="py-2.5 pl-2 text-center">
                                                                {h.override_water_units != null && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">ปรับเอง</span>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out]">
                    <div className={`flex items-center gap-3 px-5 py-3.5 text-white rounded-xl shadow-2xl ${toast.includes('❌') ? 'bg-red-600 shadow-red-600/30' : 'bg-emerald-600 shadow-emerald-600/30'}`}>
                        <CheckCircle size={20} />
                        <span className="font-medium">{toast}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

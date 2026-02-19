'use client';

import { useEffect, useState, useRef } from 'react';
import { BarChart3, TrendingUp, DollarSign, Zap, Droplets, Home, ChevronLeft, ChevronRight, Calendar, CheckCircle, Clock, Printer, Download } from 'lucide-react';
import { nowBangkok, currentMonthBangkok, formatThaiDate } from '@/lib/timezone';

interface ReportSummary {
    total_invoices: string;
    paid_count: string;
    pending_count: string;
    total_rent: string;
    total_electric: string;
    total_water_faucet: string;
    total_water_shared: string;
    grand_total: string;
    total_collected: string;
    total_pending: string;
    total_electric_units: string;
    total_water_faucet_units: string;
}

interface RoomDetail {
    id: number;
    room_number: string;
    floor: number;
    tenant_name: string | null;
    occupants: number;
    rent: string;
    electric_units: string;
    electric_cost: string;
    water_faucet_units: string;
    water_faucet_cost: string;
    water_shared_cost: string;
    total_amount: string;
    status: string;
}

interface TrendItem {
    month: string;
    total: string;
    collected: string;
    rent: string;
    electric: string;
    water: string;
    invoice_count: string;
}

interface FloorSummary {
    floor: number;
    room_count: string;
    total: string;
    collected: string;
}

interface RoomSummary {
    total_rooms: string;
    occupied: string;
    available: string;
    maintenance: string;
}

interface ReportData {
    summary: ReportSummary;
    rooms: RoomDetail[];
    roomSummary: RoomSummary;
    trend: TrendItem[];
    floorSummary: FloorSummary[];
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const FULL_THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

function fmt(val: string | number): string {
    return parseFloat(String(val || 0)).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function getMonthLabel(month: string): string {
    const [y, m] = month.split('-');
    return `${FULL_THAI_MONTHS[parseInt(m) - 1]} ${parseInt(y) + 543}`;
}

function getShortMonthLabel(month: string): string {
    const [, m] = month.split('-');
    return THAI_MONTHS[parseInt(m) - 1];
}

export default function ReportPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(() => currentMonthBangkok());
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(() => nowBangkok().getFullYear());
    const pickerRef = useRef<HTMLDivElement>(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/report?month=${month}`);
            const json = await res.json();
            setData(json);
        } catch {
            setData(null);
        }
        setLoading(false);
    };

    useEffect(() => { fetchReport(); }, [month]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                    <p className="text-[var(--color-text-secondary)]">กำลังโหลดรายงาน...</p>
                </div>
            </div>
        );
    }

    const s = data?.summary;
    const grandTotal = parseFloat(s?.grand_total || '0');
    const totalCollected = parseFloat(s?.total_collected || '0');
    const totalPending = parseFloat(s?.total_pending || '0');
    const totalRent = parseFloat(s?.total_rent || '0');
    const totalElectric = parseFloat(s?.total_electric || '0');
    const totalWaterFaucet = parseFloat(s?.total_water_faucet || '0');
    const totalWaterShared = parseFloat(s?.total_water_shared || '0');
    const totalWater = totalWaterFaucet + totalWaterShared;
    const collectionRate = grandTotal > 0 ? Math.round((totalCollected / grandTotal) * 100) : 0;
    const occupancy = data?.roomSummary ? Math.round((parseInt(data.roomSummary.occupied) / parseInt(data.roomSummary.total_rooms)) * 100) : 0;

    // Revenue breakdown percentages
    const rentPct = grandTotal > 0 ? (totalRent / grandTotal * 100) : 0;
    const electricPct = grandTotal > 0 ? (totalElectric / grandTotal * 100) : 0;
    const waterPct = grandTotal > 0 ? (totalWater / grandTotal * 100) : 0;

    // Trend chart max
    const trendMax = Math.max(...(data?.trend || []).map(t => parseFloat(t.total)), 1);

    return (
        <div className="print:p-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
                        <BarChart3 className="text-indigo-500" size={28} />
                        รายงานสรุปรายเดือน
                    </h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        {getMonthLabel(month)}
                    </p>
                </div>
                <div className="flex items-center gap-3 no-print">
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
                                    {getMonthLabel(month)}
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
                                    {/* Month grid 3x4 */}
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {THAI_MONTHS.map((label, idx) => {
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
                                                    className={`py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${isSelected
                                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                                        : isCurrent
                                                            ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100'
                                                            : 'hover:bg-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Print */}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer"
                    >
                        <Printer size={16} />
                        พิมพ์
                    </button>
                </div>
            </div>

            {/* Summary Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-white/80">รายได้ทั้งหมด</span>
                        <DollarSign size={20} className="text-white/60" />
                    </div>
                    <div className="text-2xl font-bold">฿{fmt(grandTotal)}</div>
                    <div className="text-xs text-white/70 mt-1">{s?.total_invoices || 0} ห้อง</div>
                </div>

                {/* Collected */}
                <div className="bg-white rounded-2xl p-5 border border-[var(--color-border)] shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">เก็บได้แล้ว</span>
                        <CheckCircle size={20} className="text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">฿{fmt(totalCollected)}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${collectionRate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">{collectionRate}%</span>
                    </div>
                </div>

                {/* Pending */}
                <div className="bg-white rounded-2xl p-5 border border-[var(--color-border)] shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">ค้างชำระ</span>
                        <Clock size={20} className="text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-amber-600">฿{fmt(totalPending)}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">{s?.pending_count || 0} ห้อง</div>
                </div>

                {/* Occupancy */}
                <div className="bg-white rounded-2xl p-5 border border-[var(--color-border)] shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">อัตราเข้าพัก</span>
                        <Home size={20} className="text-indigo-500" />
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">{occupancy}%</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">
                        {data?.roomSummary?.occupied || 0}/{data?.roomSummary?.total_rooms || 0} ห้อง
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-500" />
                        แนวโน้มรายได้ 6 เดือน
                    </h3>
                    <div className="flex items-end gap-2 h-[180px]">
                        {(data?.trend || []).map((t, i) => {
                            const total = parseFloat(t.total);
                            const collected = parseFloat(t.collected);
                            const barH = (total / trendMax) * 100;
                            const collectedH = total > 0 ? (collected / total) * barH : 0;
                            const isCurrentMonth = t.month === month;
                            return (
                                <div key={t.month} className="flex-1 flex flex-col items-center gap-1" title={`${getMonthLabel(t.month)}\nรวม: ฿${fmt(total)}\nเก็บได้: ฿${fmt(collected)}`}>
                                    <span className="text-[10px] font-medium text-[var(--color-text-muted)]">฿{total >= 1000 ? `${(total / 1000).toFixed(0)}k` : fmt(total)}</span>
                                    <div className="w-full flex flex-col justify-end" style={{ height: '140px' }}>
                                        <div className="relative w-full rounded-t-lg overflow-hidden" style={{ height: `${Math.max(barH, 2)}%` }}>
                                            <div className={`absolute inset-0 ${isCurrentMonth ? 'bg-indigo-200' : 'bg-gray-100'}`} />
                                            <div
                                                className={`absolute bottom-0 left-0 right-0 ${isCurrentMonth ? 'bg-indigo-500' : 'bg-indigo-300'} rounded-t-lg transition-all`}
                                                style={{ height: `${collectedH / Math.max(barH, 1) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-medium ${isCurrentMonth ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                                        {getShortMonthLabel(t.month)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-indigo-500" />
                            <span className="text-[10px] text-gray-500">เก็บได้</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-indigo-200" />
                            <span className="text-[10px] text-gray-500">ยังไม่ชำระ</span>
                        </div>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">สัดส่วนรายได้</h3>

                    {/* Donut chart visualization */}
                    <div className="flex justify-center mb-4">
                        <div className="relative w-32 h-32">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#6366f1" strokeWidth="4"
                                    strokeDasharray={`${rentPct * 0.879} ${87.96 - rentPct * 0.879}`}
                                    strokeDashoffset="0" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4"
                                    strokeDasharray={`${electricPct * 0.879} ${87.96 - electricPct * 0.879}`}
                                    strokeDashoffset={`${-rentPct * 0.879}`} />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#06b6d4" strokeWidth="4"
                                    strokeDasharray={`${waterPct * 0.879} ${87.96 - waterPct * 0.879}`}
                                    strokeDashoffset={`${-(rentPct + electricPct) * 0.879}`} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold text-[var(--color-text)]">฿{grandTotal >= 1000 ? `${(grandTotal / 1000).toFixed(0)}k` : fmt(grandTotal)}</span>
                                <span className="text-[9px] text-gray-400">รวม</span>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown list */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded bg-indigo-500" />
                                <span className="text-xs text-gray-600">🏠 ค่าเช่า</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold">฿{fmt(totalRent)}</span>
                                <span className="text-[10px] text-gray-400 ml-1">({rentPct.toFixed(0)}%)</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded bg-amber-500" />
                                <span className="text-xs text-gray-600">⚡ ค่าไฟ</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold">฿{fmt(totalElectric)}</span>
                                <span className="text-[10px] text-gray-400 ml-1">({electricPct.toFixed(0)}%)</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded bg-cyan-500" />
                                <span className="text-xs text-gray-600">💧 ค่าน้ำ</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold">฿{fmt(totalWater)}</span>
                                <span className="text-[10px] text-gray-400 ml-1">({waterPct.toFixed(0)}%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floor Summary */}
            {(data?.floorSummary?.length || 0) > 0 && (
                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5 shadow-sm mb-6">
                    <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">สรุปรายชั้น</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(data?.floorSummary || []).map(f => {
                            const total = parseFloat(f.total);
                            const collected = parseFloat(f.collected);
                            const pct = total > 0 ? Math.round((collected / total) * 100) : 0;
                            return (
                                <div key={f.floor} className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-[var(--color-text)]">ชั้น {f.floor}</span>
                                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{f.room_count} ห้อง</span>
                                    </div>
                                    <div className="text-lg font-bold text-[var(--color-text)]">฿{fmt(total)}</div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-[10px] font-medium text-emerald-600">{pct}%</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-1">เก็บได้ ฿{fmt(collected)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Room Details Table */}
            <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden mb-6">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">รายละเอียดแต่ละห้อง</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-[var(--color-text-secondary)]">
                                <th className="text-left px-5 py-3 font-medium">ห้อง</th>
                                <th className="text-left px-4 py-3 font-medium">ผู้เช่า</th>
                                <th className="text-right px-4 py-3 font-medium">ค่าเช่า</th>
                                <th className="text-right px-4 py-3 font-medium">⚡ ค่าไฟ</th>
                                <th className="text-right px-4 py-3 font-medium">💧 ค่าน้ำรวม</th>
                                <th className="text-right px-4 py-3 font-medium font-semibold">รวม</th>
                                <th className="text-center px-4 py-3 font-medium">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(data?.rooms || []).map(room => (
                                <tr key={room.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-5 py-3">
                                        <span className="font-semibold text-[var(--color-text)]">{room.room_number}</span>
                                        <span className="text-[10px] text-gray-400 ml-1.5">ชั้น {room.floor}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{room.tenant_name || '—'}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">฿{fmt(room.rent)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        <div>฿{fmt(room.electric_cost)}</div>
                                        <div className="text-[10px] text-gray-400">{fmt(room.electric_units)} หน่วย</div>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        <div>฿{fmt(parseFloat(room.water_faucet_cost) + parseFloat(room.water_shared_cost))}</div>
                                        <div className="text-[10px] text-gray-400">ก๊อก ฿{fmt(room.water_faucet_cost)} + รวม ฿{fmt(room.water_shared_cost)}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-[var(--color-text)]">฿{fmt(room.total_amount)}</td>
                                    <td className="px-4 py-3 text-center">
                                        {room.status === 'paid' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium">
                                                <CheckCircle size={10} /> ชำระแล้ว
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-medium">
                                                <Clock size={10} /> ค้างชำระ
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {/* Footer totals */}
                        <tfoot>
                            <tr className="bg-indigo-50/50 font-semibold text-[var(--color-text)]">
                                <td className="px-5 py-3" colSpan={2}>รวมทั้งหมด</td>
                                <td className="px-4 py-3 text-right tabular-nums">฿{fmt(totalRent)}</td>
                                <td className="px-4 py-3 text-right tabular-nums">฿{fmt(totalElectric)}</td>
                                <td className="px-4 py-3 text-right tabular-nums">฿{fmt(totalWater)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-indigo-600">฿{fmt(grandTotal)}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-[10px] text-emerald-600 font-semibold">{s?.paid_count || 0}/{s?.total_invoices || 0}</span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Utility Usage Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap size={18} className="text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">สรุปค่าไฟ</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-amber-600/70">หน่วยรวม</div>
                            <div className="text-xl font-bold text-amber-700">{fmt(s?.total_electric_units || 0)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-amber-600/70">ค่าไฟรวม</div>
                            <div className="text-xl font-bold text-amber-700">฿{fmt(totalElectric)}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-sky-50 rounded-2xl border border-cyan-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Droplets size={18} className="text-cyan-600" />
                        <span className="text-sm font-semibold text-cyan-800">สรุปค่าน้ำ</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <div className="text-xs text-cyan-600/70">หน่วยรวม</div>
                            <div className="text-lg font-bold text-cyan-700">{fmt(s?.total_water_faucet_units || 0)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-cyan-600/70">น้ำก๊อก</div>
                            <div className="text-lg font-bold text-cyan-700">฿{fmt(totalWaterFaucet)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-cyan-600/70">น้ำห้องน้ำรวม</div>
                            <div className="text-lg font-bold text-cyan-700">฿{fmt(totalWaterShared)}</div>
                        </div>
                        <div className="bg-cyan-100/60 rounded-xl p-2 -m-1">
                            <div className="text-xs text-cyan-700 font-medium">ค่าน้ำรวมทั้งหมด</div>
                            <div className="text-xl font-bold text-cyan-800">฿{fmt(totalWater)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
                <p>รายงานสรุปรายเดือน — {getMonthLabel(month)} — พิมพ์เมื่อ {formatThaiDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="mt-1">HomeyStay © {nowBangkok().getFullYear() + 543}</p>
            </div>
        </div>
    );
}

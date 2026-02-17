'use client';

import { useEffect, useState } from 'react';
import { History, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle, Users, DoorOpen, TrendingUp, TrendingDown } from 'lucide-react';

interface Invoice {
    id: number;
    room_id: number;
    month: string;
    status: string;
    rent: number;
    electric_units: number;
    electric_cost: number;
    water_faucet_units: number;
    water_faucet_cost: number;
    water_shared_cost: number;
    total_amount: number;
    room_number: string;
    tenant_name: string | null;
}

interface RoomHistory {
    room_id: number;
    room_number: string;
    tenant_name: string | null;
    invoices: Invoice[];
    total_paid: number;
    total_pending: number;
    months_overdue: number;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; bg: string; text: string }> = {
    pending: { label: 'ค้างชำระ', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700' },
    paid: { label: 'ชำระแล้ว', icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-700' },
    overdue: { label: 'เกินกำหนด', icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700' },
};

function formatMonth(month: string) {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const [y, m] = month.split('-').map(Number);
    return `${months[m - 1]} ${y + 543}`;
}

export default function HistoryPage() {
    const [data, setData] = useState<RoomHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [filter, setFilter] = useState<'all' | 'overdue'>('all');

    useEffect(() => {
        fetch('/api/history')
            .then(r => r.json())
            .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const toggle = (roomId: number) => {
        setExpanded(prev => ({ ...prev, [roomId]: !prev[roomId] }));
    };

    const filtered = filter === 'overdue'
        ? data.filter(r => r.months_overdue > 0)
        : data;

    const totalAllPaid = data.reduce((s, r) => s + r.total_paid, 0);
    const totalAllPending = data.reduce((s, r) => s + r.total_pending, 0);
    const totalOverdueRooms = data.filter(r => r.months_overdue > 0).length;

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
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">ประวัติชำระเงิน</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">ดูย้อนหลังการชำระค่าเช่าทุกห้อง</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${filter === 'all'
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-50'
                            }`}
                    >
                        ทั้งหมด
                    </button>
                    <button
                        onClick={() => setFilter('overdue')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${filter === 'overdue'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                            : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-50'
                            }`}
                    >
                        ค้างชำระ ({totalOverdueRooms})
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--color-text-secondary)]">ชำระแล้วทั้งหมด</p>
                            <p className="text-xl font-bold text-emerald-600">฿{totalAllPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <TrendingDown size={20} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--color-text-secondary)]">ค้างชำระรวม</p>
                            <p className="text-xl font-bold text-amber-600">฿{totalAllPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <AlertCircle size={20} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--color-text-secondary)]">ห้องที่ค้าง</p>
                            <p className="text-xl font-bold text-red-600">{totalOverdueRooms} ห้อง</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Room List */}
            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <History size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-[var(--color-text-secondary)]">ไม่พบข้อมูลประวัติชำระเงิน</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(room => {
                        const isOpen = expanded[room.room_id];
                        return (
                            <div key={room.room_id} className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden transition-shadow hover:shadow-md">
                                {/* Room Header - clickable */}
                                <button
                                    onClick={() => toggle(room.room_id)}
                                    className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <DoorOpen size={22} className="text-indigo-500" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-[var(--color-text)]">ห้อง {room.room_number}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {room.tenant_name ? (
                                                    <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                                                        <Users size={12} />
                                                        {room.tenant_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">ไม่มีผู้เช่า</span>
                                                )}
                                                <span className="text-xs text-gray-300">•</span>
                                                <span className="text-xs text-[var(--color-text-muted)]">{room.invoices.length} บิล</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {room.months_overdue > 0 && (
                                            <span className="text-xs font-medium bg-red-50 text-red-600 px-2.5 py-1 rounded-full hidden sm:inline-flex items-center gap-1">
                                                <AlertCircle size={12} />
                                                ค้าง {room.months_overdue} เดือน
                                            </span>
                                        )}
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-[var(--color-text-muted)]">ค้างชำระ</p>
                                            <p className={`font-semibold ${room.total_pending > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                ฿{room.total_pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                    </div>
                                </button>

                                {/* Mobile overdue badge */}
                                {!isOpen && room.months_overdue > 0 && (
                                    <div className="sm:hidden px-5 pb-3 -mt-2 flex items-center gap-2">
                                        <span className="text-xs font-medium bg-red-50 text-red-600 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            ค้าง {room.months_overdue} เดือน
                                        </span>
                                        <span className="text-xs font-semibold text-red-600">
                                            ฿{room.total_pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}

                                {/* Expanded: invoice list */}
                                {isOpen && (
                                    <div className="border-t border-[var(--color-border)]">
                                        {/* Mobile summary */}
                                        <div className="sm:hidden px-5 py-3 bg-gray-50 flex justify-between text-sm">
                                            <span className="text-[var(--color-text-secondary)]">ชำระแล้ว: <b className="text-emerald-600">฿{room.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></span>
                                            <span className="text-[var(--color-text-secondary)]">ค้าง: <b className={room.total_pending > 0 ? 'text-red-600' : 'text-emerald-600'}>฿{room.total_pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></span>
                                        </div>

                                        {/* Desktop table */}
                                        <div className="hidden sm:block overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 text-[var(--color-text-secondary)]">
                                                        <th className="text-left px-5 py-3 font-medium">เดือน</th>
                                                        <th className="text-right px-3 py-3 font-medium">ค่าเช่า</th>
                                                        <th className="text-right px-3 py-3 font-medium">ค่าไฟ</th>
                                                        <th className="text-right px-3 py-3 font-medium">ค่าน้ำ</th>
                                                        <th className="text-right px-3 py-3 font-medium">ยอดรวม</th>
                                                        <th className="text-center px-5 py-3 font-medium">สถานะ</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {room.invoices.map(inv => {
                                                        const sc = statusConfig[inv.status] || statusConfig.pending;
                                                        const StatusIcon = sc.icon;
                                                        return (
                                                            <tr key={inv.id} className="border-t border-[var(--color-border)] hover:bg-gray-50/50 transition-colors">
                                                                <td className="px-5 py-3 font-medium text-[var(--color-text)]">{formatMonth(inv.month)}</td>
                                                                <td className="text-right px-3 py-3 text-[var(--color-text-secondary)]">฿{parseFloat(String(inv.rent)).toLocaleString()}</td>
                                                                <td className="text-right px-3 py-3 text-amber-600">฿{parseFloat(String(inv.electric_cost)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                                <td className="text-right px-3 py-3 text-cyan-600">
                                                                    ฿{(parseFloat(String(inv.water_faucet_cost)) + parseFloat(String(inv.water_shared_cost))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                </td>
                                                                <td className="text-right px-3 py-3 font-semibold text-[var(--color-text)]">฿{parseFloat(String(inv.total_amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                                <td className="text-center px-5 py-3">
                                                                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                                                                        <StatusIcon size={12} />
                                                                        {sc.label}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile card list */}
                                        <div className="sm:hidden divide-y divide-[var(--color-border)]">
                                            {room.invoices.map(inv => {
                                                const sc = statusConfig[inv.status] || statusConfig.pending;
                                                const StatusIcon = sc.icon;
                                                return (
                                                    <div key={inv.id} className="px-5 py-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-[var(--color-text)]">{formatMonth(inv.month)}</span>
                                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                                                                <StatusIcon size={12} />
                                                                {sc.label}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-[var(--color-text-muted)]">ค่าเช่า</span>
                                                                <p className="font-medium text-[var(--color-text)]">฿{parseFloat(String(inv.rent)).toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-amber-500">ค่าไฟ</span>
                                                                <p className="font-medium text-amber-700">฿{parseFloat(String(inv.electric_cost)).toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-cyan-500">ค่าน้ำ</span>
                                                                <p className="font-medium text-cyan-700">
                                                                    ฿{(parseFloat(String(inv.water_faucet_cost)) + parseFloat(String(inv.water_shared_cost))).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                                                            <span className="text-xs text-[var(--color-text-muted)]">ยอดรวม</span>
                                                            <span className="font-bold text-indigo-600">฿{parseFloat(String(inv.total_amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Total row */}
                                        <div className="px-5 py-3 bg-indigo-50/50 border-t border-[var(--color-border)] flex items-center justify-between">
                                            <span className="text-sm font-medium text-indigo-700">รวมทั้งหมด</span>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-emerald-600 font-medium">✓ ฿{room.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                {room.total_pending > 0 && (
                                                    <span className="text-red-600 font-medium">✗ ฿{room.total_pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { Receipt, CheckCircle, Clock, AlertCircle, Calculator, ChevronLeft, ChevronRight, Calendar, XCircle } from 'lucide-react';
import { nowBangkok, currentMonthBangkok } from '@/lib/timezone';
import Toast from '@/components/Toast';
import type { ToastType } from '@/components/Toast';

interface Invoice {
    id: number;
    room_number: string;
    month: string;
    rent: number;
    electric_units: number;
    electric_cost: number;
    water_faucet_units: number;
    water_faucet_cost: number;
    water_shared_cost: number;
    total_amount: number;
    status: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; bg: string; text: string }> = {
    pending: { label: 'ค้างชำระ', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700' },
    paid: { label: 'ชำระแล้ว', icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-700' },
    overdue: { label: 'เกินกำหนด', icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700' },
};

export default function BillingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [month, setMonth] = useState(() => currentMonthBangkok());
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(() => nowBangkok().getFullYear());
    const pickerRef = useRef<HTMLDivElement>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const fetchInvoices = async () => {
        setLoading(true);
        const res = await fetch(`/api/billing?month=${month}`);
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { fetchInvoices(); }, [month]);

    const generateBills = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month }),
            });
            if (!res.ok) throw new Error('Server error');
            setToast({ message: 'สร้างบิลเรียบร้อยแล้ว ✅', type: 'success' });
            fetchInvoices();
        } catch {
            setToast({ message: 'สร้างบิลไม่สำเร็จ กรุณาลองใหม่', type: 'error' });
        }
        setGenerating(false);
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            const res = await fetch('/api/billing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            if (!res.ok) throw new Error('Server error');
            setToast({ message: `อัพเดตสถานะเรียบร้อยแล้ว`, type: 'success' });
            fetchInvoices();
        } catch {
            setToast({ message: 'อัพเดตสถานะไม่สำเร็จ', type: 'error' });
        }
    };

    const totalAmount = invoices.reduce((s, i) => s + parseFloat(String(i.total_amount)), 0);
    const paidAmount = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.total_amount)), 0);

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
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">บิลรายเดือน</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">คำนวณและจัดการบิลค่าเช่า ค่าไฟ ค่าน้ำ</p>
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
                        onClick={generateBills}
                        disabled={generating}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 disabled:opacity-50 cursor-pointer"
                    >
                        <Calculator size={18} />
                        {generating ? 'กำลังคำนวณ...' : 'คำนวณบิล'}
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border)]">
                    <p className="text-sm text-[var(--color-text-secondary)]">บิลทั้งหมด</p>
                    <p className="text-2xl font-bold text-[var(--color-text)] mt-1">฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border)]">
                    <p className="text-sm text-[var(--color-text-secondary)]">ชำระแล้ว</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">฿{paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border)]">
                    <p className="text-sm text-[var(--color-text-secondary)]">ค้างชำระ</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">฿{(totalAmount - paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Invoice Cards */}
            <div className="space-y-4">
                {invoices.map((inv, i) => {
                    const sc = statusConfig[inv.status] || statusConfig.pending;
                    const StatusIcon = sc.icon;

                    return (
                        <div
                            key={inv.id}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)] hover:shadow-md animate-fade-in"
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                        <Receipt size={20} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--color-text)]">ห้อง {inv.room_number}</h3>
                                        <span className="text-xs text-[var(--color-text-muted)]">{inv.month}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full ${sc.bg} ${sc.text}`}>
                                        <StatusIcon size={14} />
                                        {sc.label}
                                    </span>
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-[var(--color-text-muted)]">ค่าเช่า</p>
                                    <p className="font-semibold text-[var(--color-text)]">฿{parseFloat(String(inv.rent)).toLocaleString()}</p>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-3">
                                    <p className="text-xs text-amber-600">ค่าไฟ ({parseFloat(String(inv.electric_units))} หน่วย)</p>
                                    <p className="font-semibold text-amber-700">฿{parseFloat(String(inv.electric_cost)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="bg-cyan-50 rounded-xl p-3">
                                    <p className="text-xs text-cyan-600">ค่าน้ำก๊อก ({parseFloat(String(inv.water_faucet_units))} หน่วย)</p>
                                    <p className="font-semibold text-cyan-700">฿{parseFloat(String(inv.water_faucet_cost)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-3">
                                    <p className="text-xs text-blue-600">ค่าน้ำรวม (หาร)</p>
                                    <p className="font-semibold text-blue-700">฿{parseFloat(String(inv.water_shared_cost)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>

                            {/* Total + Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                                <div>
                                    <span className="text-sm text-[var(--color-text-secondary)]">ยอดรวม</span>
                                    <p className="text-xl font-bold text-indigo-600">฿{parseFloat(String(inv.total_amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="flex gap-2">
                                    {inv.status !== 'paid' && (
                                        <button
                                            onClick={() => updateStatus(inv.id, 'paid')}
                                            className="flex items-center gap-1 px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium cursor-pointer"
                                        >
                                            <CheckCircle size={16} />
                                            ชำระแล้ว
                                        </button>
                                    )}
                                    {inv.status === 'paid' && (
                                        <button
                                            onClick={() => updateStatus(inv.id, 'pending')}
                                            className="flex items-center gap-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium cursor-pointer"
                                        >
                                            ยกเลิกการชำระ
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {invoices.length === 0 && (
                <div className="text-center py-16 text-[var(--color-text-muted)] bg-white rounded-2xl shadow-sm border border-[var(--color-border)]">
                    <Receipt size={48} className="mx-auto mb-3 opacity-30" />
                    <p>ยังไม่มีบิลในเดือนนี้</p>
                    <p className="text-sm mt-1">กดปุ่ม &quot;คำนวณบิล&quot; เพื่อสร้างบิลจากข้อมูลมิเตอร์</p>
                </div>
            )}

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    );
}

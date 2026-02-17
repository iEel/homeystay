'use client';

import { useEffect, useState } from 'react';
import { Settings, Save, Zap, Droplets, ShowerHead, Plus, Trash2, X, TrendingUp, AlertTriangle } from 'lucide-react';
import Toast from '@/components/Toast';
import type { ToastType } from '@/components/Toast';

interface SettingItem {
    value: string;
    label: string;
}

interface Room {
    id: number;
    number: string;
}

interface Bathroom {
    id: number;
    name: string;
    rooms: { room_id: number; room_number: string }[];
}

const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    electric_rate: { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    water_rate: { icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    electric_extra_units: { icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    water_extra_units: { icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
    electric_alert_units: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    water_alert_units: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
};

const unitSuffix: Record<string, string> = {
    electric_rate: 'บาท/หน่วย',
    water_rate: 'บาท/หน่วย',
    electric_extra_units: 'หน่วย/ห้อง',
    water_extra_units: 'หน่วย/ห้อง',
    electric_alert_units: 'หน่วย',
    water_alert_units: 'หน่วย',
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<Record<string, SettingItem>>({});
    const [values, setValues] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Bathroom management
    const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [showBathroomModal, setShowBathroomModal] = useState(false);
    const [editBathroom, setEditBathroom] = useState<Bathroom | null>(null);
    const [bathroomForm, setBathroomForm] = useState({ name: '', room_ids: [] as number[] });

    const fetchSettings = async () => {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data);
        const vals: Record<string, string> = {};
        Object.entries(data).forEach(([key, val]) => {
            vals[key] = (val as SettingItem).value;
        });
        setValues(vals);
    };

    const fetchBathrooms = async () => {
        const [bathroomsRes, roomsRes] = await Promise.all([
            fetch('/api/bathrooms').then(r => r.json()),
            fetch('/api/rooms').then(r => r.json()),
        ]);
        setBathrooms(Array.isArray(bathroomsRes) ? bathroomsRes : []);
        setRooms(Array.isArray(roomsRes) ? roomsRes : []);
    };

    useEffect(() => {
        Promise.all([fetchSettings(), fetchBathrooms()]).then(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            if (!res.ok) throw new Error('Server error');
            setToast({ message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว ✅', type: 'success' });
        } catch {
            setToast({ message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่', type: 'error' });
        }
        setSaving(false);
    };

    const openAddBathroom = () => {
        setEditBathroom(null);
        setBathroomForm({ name: '', room_ids: [] });
        setShowBathroomModal(true);
    };

    const openEditBathroom = (b: Bathroom) => {
        setEditBathroom(b);
        setBathroomForm({
            name: b.name,
            room_ids: b.rooms.map(r => r.room_id),
        });
        setShowBathroomModal(true);
    };

    const toggleRoom = (roomId: number) => {
        setBathroomForm(prev => ({
            ...prev,
            room_ids: prev.room_ids.includes(roomId)
                ? prev.room_ids.filter(id => id !== roomId)
                : [...prev.room_ids, roomId],
        }));
    };

    const handleSaveBathroom = async () => {
        const method = editBathroom ? 'PUT' : 'POST';
        const payload = editBathroom
            ? { id: editBathroom.id, ...bathroomForm }
            : bathroomForm;

        try {
            const res = await fetch('/api/bathrooms', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Server error');
            setShowBathroomModal(false);
            setToast({ message: editBathroom ? 'แก้ไขห้องน้ำเรียบร้อย' : 'เพิ่มห้องน้ำเรียบร้อย', type: 'success' });
            fetchBathrooms();
        } catch {
            setToast({ message: 'บันทึกห้องน้ำไม่สำเร็จ', type: 'error' });
        }
    };

    const handleDeleteBathroom = async (id: number) => {
        if (!confirm('ลบห้องน้ำนี้?')) return;
        try {
            const res = await fetch(`/api/bathrooms?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Server error');
            setToast({ message: 'ลบห้องน้ำเรียบร้อย', type: 'success' });
            fetchBathrooms();
        } catch {
            setToast({ message: 'ลบห้องน้ำไม่สำเร็จ', type: 'error' });
        }
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
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">ตั้งค่าระบบ</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">กำหนดอัตราค่าไฟฟ้า ค่าน้ำ และจัดการห้องน้ำรวม</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 disabled:opacity-50 cursor-pointer"
                >
                    <Save size={18} />
                    {saving ? 'กำลังบันทึก...' : 'บันทึกอัตรา'}
                </button>
            </div>

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Settings — Grouped by Category */}
            {(() => {
                const groups = [
                    {
                        title: 'ค่าไฟฟ้า',
                        icon: Zap,
                        color: 'text-amber-600',
                        bg: 'bg-amber-50',
                        borderColor: 'border-amber-200',
                        keys: ['electric_rate', 'electric_extra_units'],
                    },
                    {
                        title: 'ค่าน้ำ',
                        icon: Droplets,
                        color: 'text-cyan-600',
                        bg: 'bg-cyan-50',
                        borderColor: 'border-cyan-200',
                        keys: ['water_rate', 'water_extra_units'],
                    },
                    {
                        title: 'แจ้งเตือนการใช้ผิดปกติ',
                        icon: AlertTriangle,
                        color: 'text-red-600',
                        bg: 'bg-red-50',
                        borderColor: 'border-red-200',
                        keys: ['electric_alert_units', 'water_alert_units'],
                    },
                ];

                return (
                    <div className="space-y-6 mb-10">
                        {groups.map((group) => {
                            const GroupIcon = group.icon;
                            const groupSettings = group.keys.filter(k => settings[k]);
                            if (groupSettings.length === 0) return null;

                            return (
                                <div key={group.title} className={`bg-white rounded-2xl shadow-sm border ${group.borderColor} overflow-hidden animate-fade-in`}>
                                    {/* Group Header */}
                                    <div className={`flex items-center gap-3 px-5 py-3.5 ${group.bg} border-b ${group.borderColor}`}>
                                        <div className={`w-8 h-8 bg-white/70 rounded-lg flex items-center justify-center`}>
                                            <GroupIcon size={18} className={group.color} />
                                        </div>
                                        <h3 className={`font-semibold ${group.color}`}>{group.title}</h3>
                                    </div>
                                    {/* Group Items */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border)]">
                                        {groupSettings.map((key) => {
                                            const setting = settings[key];
                                            const cfg = iconMap[key] || { icon: Settings, color: 'text-indigo-600', bg: 'bg-indigo-50' };
                                            const IconComp = cfg.icon;

                                            return (
                                                <div key={key} className="p-5">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className={`w-9 h-9 ${cfg.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                            <IconComp size={18} className={cfg.color} />
                                                        </div>
                                                        <label className="text-sm font-semibold text-[var(--color-text)]">
                                                            {setting.label}
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center gap-2 pl-[48px]">
                                                        <input
                                                            type="number"
                                                            value={values[key] || ''}
                                                            onChange={e => setValues({ ...values, [key]: e.target.value })}
                                                            className="w-28 px-3 py-2 text-lg font-semibold border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-center"
                                                            step="0.5"
                                                            min="0"
                                                        />
                                                        <span className="text-sm text-[var(--color-text-muted)]">{unitSuffix[key] || 'บาท/หน่วย'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })()}

            {/* Bathroom Management Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ShowerHead size={22} className="text-cyan-600" />
                        <h2 className="text-lg font-bold text-[var(--color-text)]">จัดการห้องน้ำรวม</h2>
                    </div>
                    <button
                        onClick={openAddBathroom}
                        className="flex items-center gap-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm font-medium cursor-pointer"
                    >
                        <Plus size={16} />
                        เพิ่มห้องน้ำ
                    </button>
                </div>

                {bathrooms.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-8 text-center text-[var(--color-text-muted)]">
                        <ShowerHead size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">ยังไม่มีห้องน้ำรวม กดเพิ่มเพื่อสร้าง</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bathrooms.map((b) => (
                            <div
                                key={b.id}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border)] hover:shadow-md transition-shadow animate-fade-in"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
                                            <ShowerHead size={20} className="text-cyan-600" />
                                        </div>
                                        <h3 className="font-semibold text-[var(--color-text)]">{b.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditBathroom(b)}
                                            className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 cursor-pointer font-medium"
                                        >
                                            แก้ไข
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBathroom(b.id)}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-[52px]">
                                    {b.rooms.length === 0 ? (
                                        <span className="text-xs text-gray-400 italic">ยังไม่ได้กำหนดห้องพัก</span>
                                    ) : (
                                        b.rooms.map((r) => (
                                            <span
                                                key={r.room_id}
                                                className="text-xs font-medium bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full"
                                            >
                                                ห้อง {r.room_number}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                <h3 className="font-semibold text-indigo-700 mb-2">💡 การคำนวณค่าใช้จ่าย</h3>
                <ul className="space-y-1.5 text-sm text-indigo-600">
                    <li>• <strong>ค่าไฟ</strong> = (หน่วยจริง + หน่วยเพิ่ม) × อัตราค่าไฟ</li>
                    <li>• <strong>ค่าน้ำก๊อก</strong> = (หน่วยจริง + หน่วยเพิ่ม) × อัตราค่าน้ำ</li>
                    <li>• <strong>ค่าน้ำรวม (ต่อห้องน้ำ)</strong> = (หน่วย × อัตราค่าน้ำ) ÷ จำนวนผู้เข้าพักของห้องที่ assign</li>
                    <li>• <strong>หน่วยเพิ่ม</strong> = จำนวนหน่วยที่เพิ่มให้แต่ละห้องอัตโนมัติ (เช่น ค่าไฟส่วนกลาง)</li>
                </ul>
            </div>

            {/* Bathroom Modal */}
            {showBathroomModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-[var(--color-text)]">
                                {editBathroom ? 'แก้ไขห้องน้ำ' : 'เพิ่มห้องน้ำ'}
                            </h3>
                            <button onClick={() => setShowBathroomModal(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ชื่อห้องน้ำ</label>
                                <input
                                    type="text"
                                    value={bathroomForm.name}
                                    onChange={e => setBathroomForm({ ...bathroomForm, name: e.target.value })}
                                    placeholder="เช่น ห้องน้ำ 1"
                                    className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">ห้องพักที่ใช้ห้องน้ำนี้</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {rooms.map((room) => {
                                        const isSelected = bathroomForm.room_ids.includes(room.id);
                                        return (
                                            <button
                                                key={room.id}
                                                type="button"
                                                onClick={() => toggleRoom(room.id)}
                                                className={`px-3 py-2 text-sm font-medium rounded-xl border cursor-pointer transition-colors ${isSelected
                                                    ? 'bg-cyan-500 text-white border-cyan-500'
                                                    : 'bg-gray-50 text-[var(--color-text)] border-[var(--color-border)] hover:bg-cyan-50'
                                                    }`}
                                            >
                                                {room.number}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-[var(--color-text-muted)] mt-2">คลิกเพื่อเลือก/ยกเลิกห้องพัก</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowBathroomModal(false)}
                                className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl font-medium hover:bg-gray-50 cursor-pointer"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveBathroom}
                                disabled={!bathroomForm.name}
                                className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium disabled:opacity-50 cursor-pointer"
                            >
                                {editBathroom ? 'บันทึก' : 'เพิ่ม'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

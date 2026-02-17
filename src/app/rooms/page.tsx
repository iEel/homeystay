'use client';

import { useEffect, useState } from 'react';
import { DoorOpen, Plus, Edit2, Trash2, Building } from 'lucide-react';
import Modal from '@/components/Modal';

interface Room {
    id: number;
    number: string;
    floor: number;
    monthly_rent: number;
    status: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    available: { label: 'ว่าง', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    occupied: { label: 'มีผู้เช่า', bg: 'bg-blue-50', text: 'text-blue-700' },
    maintenance: { label: 'ซ่อมบำรุง', bg: 'bg-amber-50', text: 'text-amber-700' },
};

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editRoom, setEditRoom] = useState<Room | null>(null);
    const [form, setForm] = useState({ number: '', floor: '1', monthly_rent: '', status: 'available' });

    const fetchRooms = async () => {
        const res = await fetch('/api/rooms');
        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => { fetchRooms(); }, []);

    const openAdd = () => {
        setEditRoom(null);
        setForm({ number: '', floor: '1', monthly_rent: '', status: 'available' });
        setModalOpen(true);
    };

    const openEdit = (room: Room) => {
        setEditRoom(room);
        setForm({
            number: room.number,
            floor: String(room.floor),
            monthly_rent: String(room.monthly_rent),
            status: room.status,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...form,
            floor: parseInt(form.floor),
            monthly_rent: parseFloat(form.monthly_rent),
            ...(editRoom ? { id: editRoom.id } : {}),
        };

        await fetch('/api/rooms', {
            method: editRoom ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        setModalOpen(false);
        fetchRooms();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ต้องการลบห้องนี้?')) return;
        await fetch(`/api/rooms?id=${id}`, { method: 'DELETE' });
        fetchRooms();
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
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">ห้องพัก</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">จัดการห้องเช่าทั้งหมด</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 cursor-pointer"
                >
                    <Plus size={18} />
                    เพิ่มห้อง
                </button>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rooms.map((room, i) => {
                    const sc = statusConfig[room.status] || statusConfig.available;
                    return (
                        <div
                            key={room.id}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-border)] hover:shadow-md hover:-translate-y-0.5 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <DoorOpen size={24} className="text-indigo-500" />
                                </div>
                                <span className={`text-xs font-medium px-3 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                                    {sc.label}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-[var(--color-text)]">ห้อง {room.number}</h3>
                            <div className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] mt-1">
                                <Building size={14} />
                                <span>ชั้น {room.floor}</span>
                            </div>
                            <p className="text-lg font-semibold text-indigo-500 mt-3">
                                ฿{parseFloat(String(room.monthly_rent)).toLocaleString()}<span className="text-sm font-normal text-[var(--color-text-muted)]">/เดือน</span>
                            </p>

                            <div className="flex gap-2 mt-4 lg:opacity-0 lg:group-hover:opacity-100">
                                <button
                                    onClick={() => openEdit(room)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"
                                >
                                    <Edit2 size={12} /> แก้ไข
                                </button>
                                <button
                                    onClick={() => handleDelete(room.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 rounded-lg text-red-600 cursor-pointer"
                                >
                                    <Trash2 size={12} /> ลบ
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {rooms.length === 0 && (
                <div className="text-center py-16 text-[var(--color-text-muted)]">
                    <DoorOpen size={48} className="mx-auto mb-3 opacity-30" />
                    <p>ยังไม่มีห้องพัก</p>
                    <p className="text-sm mt-1">กดปุ่ม &quot;เพิ่มห้อง&quot; เพื่อเริ่มต้น</p>
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRoom ? 'แก้ไขห้องพัก' : 'เพิ่มห้องพัก'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">เลขห้อง</label>
                        <input
                            type="text"
                            value={form.number}
                            onChange={e => setForm({ ...form, number: e.target.value })}
                            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            placeholder="เช่น 101"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ชั้น</label>
                        <input
                            type="number"
                            value={form.floor}
                            onChange={e => setForm({ ...form, floor: e.target.value })}
                            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            min="1"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ค่าเช่ารายเดือน (บาท)</label>
                        <input
                            type="number"
                            value={form.monthly_rent}
                            onChange={e => setForm({ ...form, monthly_rent: e.target.value })}
                            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            placeholder="3500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">สถานะ</label>
                        <select
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value })}
                            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-white"
                        >
                            <option value="available">ว่าง</option>
                            <option value="occupied">มีผู้เช่า</option>
                            <option value="maintenance">ซ่อมบำรุง</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                        {editRoom ? 'บันทึกการแก้ไข' : 'เพิ่มห้อง'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}

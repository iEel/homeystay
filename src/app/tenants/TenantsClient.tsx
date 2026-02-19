'use client';

import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Phone, CreditCard } from 'lucide-react';
import { todayBangkok } from '@/lib/timezone';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import type { ToastType } from '@/components/Toast';

export interface Tenant {
    id: number;
    name: string;
    phone: string;
    id_card: string;
    room_id: number | null;
    room_number: string | null;
    move_in_date: string;
    move_out_date: string | null;
    is_active: boolean;
    occupants: number;
}

export interface TenantRoom {
    id: number;
    number: string;
    status: string;
}

export default function TenantsClient({ initialTenants, initialRooms }: { initialTenants: Tenant[]; initialRooms: TenantRoom[] }) {
    const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
    const [rooms, setRooms] = useState<TenantRoom[]>(initialRooms);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTenant, setEditTenant] = useState<Tenant | null>(null);
    const [form, setForm] = useState({
        name: '', phone: '', id_card: '', room_id: '', move_in_date: '', is_active: true, occupants: '1'
    });
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const fetchData = async () => {
        const [t, r] = await Promise.all([
            fetch('/api/tenants').then(r => r.json()),
            fetch('/api/rooms').then(r => r.json()),
        ]);
        setTenants(Array.isArray(t) ? t : []);
        setRooms(Array.isArray(r) ? r : []);
    };

    const availableRooms = rooms.filter(r => r.status === 'available' || (editTenant && r.id === editTenant.room_id));

    const openAdd = () => {
        setEditTenant(null);
        setForm({ name: '', phone: '', id_card: '', room_id: '', move_in_date: todayBangkok(), is_active: true, occupants: '1' });
        setModalOpen(true);
    };

    const openEdit = (tenant: Tenant) => {
        setEditTenant(tenant);
        setForm({
            name: tenant.name,
            phone: tenant.phone || '',
            id_card: tenant.id_card || '',
            room_id: tenant.room_id ? String(tenant.room_id) : '',
            move_in_date: tenant.move_in_date?.split('T')[0] || '',
            is_active: tenant.is_active,
            occupants: String(tenant.occupants || 1),
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...form,
                room_id: form.room_id ? parseInt(form.room_id) : null,
                occupants: parseInt(form.occupants) || 1,
                ...(editTenant ? { id: editTenant.id } : {}),
            };

            const res = await fetch('/api/tenants', {
                method: editTenant ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'เกิดข้อผิดพลาด');
            }

            setModalOpen(false);
            setToast({ message: editTenant ? 'แก้ไขผู้เช่าสำเร็จ' : 'เพิ่มผู้เช่าสำเร็จ', type: 'success' });
            fetchData();
        } catch (err) {
            setToast({ message: err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('ต้องการลบผู้เช่านี้?')) return;
        try {
            const res = await fetch(`/api/tenants?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('ลบไม่สำเร็จ');
            setToast({ message: 'ลบผู้เช่าสำเร็จ', type: 'success' });
            fetchData();
        } catch {
            setToast({ message: 'ลบผู้เช่าไม่สำเร็จ', type: 'error' });
        }
    };



    return (
        <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">ผู้เช่า</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">จัดการข้อมูลผู้เช่า ({tenants.filter(t => t.is_active).length} คน active)</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 cursor-pointer"
                >
                    <Plus size={18} />
                    เพิ่มผู้เช่า
                </button>
            </div>

            {/* Mobile Card Layout */}
            <div className="lg:hidden space-y-3">
                {tenants.map((tenant) => (
                    <div key={tenant.id} className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Users size={18} className="text-indigo-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-[var(--color-text)] truncate">{tenant.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {tenant.room_number ? (
                                            <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                                                ห้อง {tenant.room_number}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">ไม่มีห้อง</span>
                                        )}
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tenant.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {tenant.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    onClick={() => openEdit(tenant)}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(tenant.id)}
                                    className="p-2 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm pl-[52px]">
                            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                <Phone size={12} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{tenant.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                <span className="text-xs">👤 {tenant.occupants || 1} คน</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                <CreditCard size={12} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate text-xs">{tenant.id_card || '-'}</span>
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)]">
                                📅 {tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString('th-TH') : '-'}
                            </div>
                        </div>
                    </div>
                ))}
                {tenants.length === 0 && (
                    <div className="text-center py-16 text-[var(--color-text-muted)]">
                        <Users size={48} className="mx-auto mb-3 opacity-30" />
                        <p>ยังไม่มีผู้เช่า</p>
                    </div>
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-[var(--color-border)]">
                                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-text-secondary)]">ชื่อ</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-text-secondary)]">โทรศัพท์</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-text-secondary)]">บัตรประชาชน</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-text-secondary)]">ห้อง</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-text-secondary)]">ผู้เข้าพัก</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-text-secondary)]">วันเข้าอยู่</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--color-text-secondary)]">สถานะ</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--color-text-secondary)]">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map((tenant) => (
                                <tr key={tenant.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center">
                                                <Users size={16} className="text-indigo-500" />
                                            </div>
                                            <span className="font-medium text-sm">{tenant.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                                        <div className="flex items-center gap-1">
                                            <Phone size={14} className="text-gray-400" />
                                            {tenant.phone || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                                        <div className="flex items-center gap-1">
                                            <CreditCard size={14} className="text-gray-400" />
                                            {tenant.id_card || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tenant.room_number ? (
                                            <span className="text-sm font-medium bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                                                ห้อง {tenant.room_number}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">ไม่มีห้อง</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium bg-violet-50 text-violet-600 px-3 py-1 rounded-full">
                                            {tenant.occupants || 1} คน
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                                        {tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString('th-TH') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${tenant.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {tenant.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(tenant)}
                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tenant.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg text-red-400 cursor-pointer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {tenants.length === 0 && (
                    <div className="text-center py-16 text-[var(--color-text-muted)]">
                        <Users size={48} className="mx-auto mb-3 opacity-30" />
                        <p>ยังไม่มีผู้เช่า</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTenant ? 'แก้ไขผู้เช่า' : 'เพิ่มผู้เช่า'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ชื่อ-นามสกุล</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">โทรศัพท์</label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">บัตรประชาชน</label>
                            <input
                                type="text"
                                value={form.id_card}
                                onChange={e => setForm({ ...form, id_card: e.target.value })}
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">ห้องพัก</label>
                        <select
                            value={form.room_id}
                            onChange={e => setForm({ ...form, room_id: e.target.value })}
                            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-white"
                        >
                            <option value="">— ไม่ระบุ —</option>
                            {availableRooms.map(r => (
                                <option key={r.id} value={r.id}>ห้อง {r.number}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">วันเข้าอยู่</label>
                        <input
                            type="date"
                            value={form.move_in_date}
                            onChange={e => setForm({ ...form, move_in_date: e.target.value })}
                            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">จำนวนผู้เข้าพัก (คน)</label>
                        <input
                            type="number"
                            min="1"
                            value={form.occupants}
                            onChange={e => setForm({ ...form, occupants: e.target.value })}
                            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            required
                        />
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">ใช้สำหรับคำนวณค่าน้ำห้องน้ำรวม (หารเฉลี่ยตามจำนวนคน)</p>
                    </div>
                    {editTenant && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={form.is_active}
                                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <label htmlFor="is_active" className="text-sm text-[var(--color-text)]">ยังคงเช่าอยู่ (Active)</label>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                        {editTenant ? 'บันทึกการแก้ไข' : 'เพิ่มผู้เช่า'}
                    </button>
                </form>
            </Modal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

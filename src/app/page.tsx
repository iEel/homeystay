'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import { DoorOpen, Users, UserCheck, ShowerHead, Zap, Droplets, Receipt, AlertCircle, TrendingUp, ArrowRight, Building2, BedDouble, BarChart3 } from 'lucide-react';
import { formatThaiDate } from '@/lib/timezone';
import Link from 'next/link';

interface MonthlyData {
  month: string;
  invoice_count: number;
  total_rent: number;
  total_electric: number;
  total_water_faucet: number;
  total_water_shared: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
}

interface Room {
  id: number;
  number: string;
  floor: number;
  monthly_rent: number;
  status: string;
}

interface Bathroom {
  id: number;
  name: string;
  rooms: { room_id: number; room_number: string }[];
}

interface Tenant {
  id: number;
  name: string;
  is_active: boolean;
  occupants: number;
  room_number: string | null;
}

interface Invoice {
  id: number;
  room_number: string;
  month: string;
  rent: number;
  electric_cost: number;
  water_faucet_cost: number;
  water_shared_cost: number;
  total_amount: number;
  status: string;
}

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/rooms').then(r => r.json()),
      fetch('/api/tenants').then(r => r.json()),
      fetch('/api/billing').then(r => r.json()),
      fetch('/api/bathrooms').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()),
    ]).then(([roomsData, tenantsData, invoicesData, bathroomsData, dashData]) => {
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setBathrooms(Array.isArray(bathroomsData) ? bathroomsData : []);
      setMonthlyHistory(Array.isArray(dashData) ? dashData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const activeTenants = tenants.filter(t => t.is_active);
  const totalActiveTenants = activeTenants.length;
  const totalOccupants = activeTenants.reduce((sum, t) => sum + (t.occupants || 1), 0);

  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(String(i.total_amount)), 0);
  const totalPending = pendingInvoices.reduce((sum, i) => sum + parseFloat(String(i.total_amount)), 0);
  const monthlyRentTotal = rooms.filter(r => r.status === 'occupied').reduce((sum, r) => sum + parseFloat(String(r.monthly_rent || 0)), 0);

  // Utility costs from all invoices (current month)
  const totalElectricCost = invoices.reduce((sum, i) => sum + parseFloat(String(i.electric_cost || 0)), 0);
  const totalWaterFaucetCost = invoices.reduce((sum, i) => sum + parseFloat(String(i.water_faucet_cost || 0)), 0);
  const totalWaterSharedCost = invoices.reduce((sum, i) => sum + parseFloat(String(i.water_shared_cost || 0)), 0);
  const totalWaterCost = totalWaterFaucetCost + totalWaterSharedCost;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Donut chart SVG for occupancy
  const donutRadius = 40;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const occupiedDash = (occupiedRooms / (totalRooms || 1)) * donutCircumference;
  const availableDash = (availableRooms / (totalRooms || 1)) * donutCircumference;
  const maintenanceDash = (maintenanceRooms / (totalRooms || 1)) * donutCircumference;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">แดชบอร์ด</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">ภาพรวมการจัดการห้องเช่า</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">อัพเดตล่าสุด</span>
          <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full">
            {formatThaiDate(new Date(), { day: 'numeric', month: 'short', year: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="ห้องทั้งหมด"
          value={totalRooms}
          icon={DoorOpen}
          color="#6366f1"
          trend={`ว่าง ${availableRooms} ห้อง`}
        />
        <StatCard
          label="สัญญาเช่า (Active)"
          value={totalActiveTenants}
          icon={Users}
          color="#3b82f6"
          trend={`${occupiedRooms}/${totalRooms} ห้อง`}
        />
        <StatCard
          label="ผู้เข้าพักทั้งหมด"
          value={`${totalOccupants} คน`}
          icon={UserCheck}
          color="#8b5cf6"
        />
        <StatCard
          label="รายได้ (ชำระแล้ว)"
          value={`฿${totalRevenue.toLocaleString()}`}
          icon={Receipt}
          color="#10b981"
          trend={pendingInvoices.length > 0 ? `ค้าง ${pendingInvoices.length} บิล` : undefined}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Occupancy Donut Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)] animate-fade-in">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-indigo-500" />
            อัตราการเข้าพัก
          </h2>
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="140" height="140" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle cx="50" cy="50" r={donutRadius} fill="none" stroke="#f3f4f6" strokeWidth="12" />
                {/* Occupied */}
                <circle
                  cx="50" cy="50" r={donutRadius} fill="none"
                  stroke="#6366f1" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${occupiedDash} ${donutCircumference}`}
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-700"
                />
                {/* Available */}
                <circle
                  cx="50" cy="50" r={donutRadius} fill="none"
                  stroke="#10b981" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${availableDash} ${donutCircumference}`}
                  strokeDashoffset={`-${occupiedDash}`}
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-700"
                />
                {/* Maintenance */}
                {maintenanceRooms > 0 && (
                  <circle
                    cx="50" cy="50" r={donutRadius} fill="none"
                    stroke="#f59e0b" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${maintenanceDash} ${donutCircumference}`}
                    strokeDashoffset={`-${occupiedDash + availableDash}`}
                    transform="rotate(-90 50 50)"
                    className="transition-all duration-700"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[var(--color-text)]">{occupancyRate}%</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">เข้าพัก</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-xs text-[var(--color-text-secondary)]">เช่า {occupiedRooms}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-[var(--color-text-secondary)]">ว่าง {availableRooms}</span>
            </div>
            {maintenanceRooms > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs text-[var(--color-text-secondary)]">ซ่อม {maintenanceRooms}</span>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)] animate-fade-in">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            สรุปรายได้
          </h2>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3.5 flex items-center justify-between">
              <p className="text-xs text-emerald-600">ชำระแล้ว</p>
              <p className="text-lg font-bold text-emerald-700">฿{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3.5 flex items-center justify-between">
              <p className="text-xs text-amber-600">ค้างชำระ ({pendingInvoices.length} บิล)</p>
              <p className="text-lg font-bold text-amber-700">฿{totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap size={13} className="text-amber-500" />
                  <p className="text-xs text-amber-600">ค่าไฟ</p>
                </div>
                <p className="text-base font-bold text-amber-700">฿{totalElectricCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Droplets size={13} className="text-cyan-500" />
                  <p className="text-xs text-cyan-600">ค่าน้ำ</p>
                </div>
                <p className="text-base font-bold text-cyan-700">฿{totalWaterCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-3.5 flex items-center justify-between">
              <p className="text-xs text-indigo-600">ค่าเช่ารวม/เดือน</p>
              <p className="text-lg font-bold text-indigo-700">฿{monthlyRentTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)] animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-500" />
              บิลค้างชำระ
            </h2>
            {pendingInvoices.length > 0 && (
              <Link href="/billing" className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 font-medium">
                ดูทั้งหมด <ArrowRight size={12} />
              </Link>
            )}
          </div>
          {pendingInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-muted)]">
              <Receipt size={40} className="mb-2 opacity-30" />
              <p className="text-sm">ไม่มีบิลค้างชำระ 🎉</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {pendingInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-amber-50/70 rounded-xl hover:bg-amber-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <BedDouble size={14} className="text-amber-600" />
                    </div>
                    <div>
                      <span className="font-medium text-sm text-[var(--color-text)]">ห้อง {inv.room_number}</span>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{inv.month}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm text-amber-700">฿{parseFloat(String(inv.total_amount)).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6-Month Income Chart */}
      {monthlyHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)] animate-fade-in mb-6">
          <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-500" />
            รายได้ 6 เดือนย้อนหลัง
          </h2>
          {(() => {
            const maxAmount = Math.max(...monthlyHistory.map(d => d.total_amount), 1);
            const chartHeight = 180;
            const barWidth = 100 / monthlyHistory.length;
            const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            const formatMonth = (m: string) => {
              const mo = parseInt(m.split('-')[1]);
              return thaiMonths[mo - 1] || m;
            };

            return (
              <div>
                {/* Bars */}
                <div className="flex items-end gap-2 sm:gap-3" style={{ height: chartHeight }}>
                  {monthlyHistory.map((d, i) => {
                    const totalH = (d.total_amount / maxAmount) * chartHeight;
                    const rentH = (d.total_rent / maxAmount) * chartHeight;
                    const electricH = (d.total_electric / maxAmount) * chartHeight;
                    const waterH = ((d.total_water_faucet + d.total_water_shared) / maxAmount) * chartHeight;
                    return (
                      <div key={d.month} className="flex-1 flex flex-col items-center group" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="relative w-full flex flex-col items-center">
                          {/* Tooltip */}
                          <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            ฿{d.total_amount.toLocaleString()}
                          </div>
                          {/* Stacked bar */}
                          <div className="w-full max-w-[48px] flex flex-col-reverse rounded-t-lg overflow-hidden">
                            <div className="bg-indigo-500 transition-all duration-500" style={{ height: `${rentH}px` }} />
                            <div className="bg-amber-400 transition-all duration-500" style={{ height: `${electricH}px` }} />
                            <div className="bg-cyan-400 transition-all duration-500" style={{ height: `${waterH}px` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div className="flex gap-2 sm:gap-3 mt-2">
                  {monthlyHistory.map((d) => (
                    <div key={d.month} className="flex-1 text-center">
                      <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{formatMonth(d.month)}</span>
                    </div>
                  ))}
                </div>

                {/* Legend + Summary */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                      <span className="text-xs text-gray-500">ค่าเช่า</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                      <span className="text-xs text-gray-500">ค่าไฟ</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                      <span className="text-xs text-gray-500">ค่าน้ำ</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    รวม ฿{monthlyHistory.reduce((s, d) => s + d.total_amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Room Grid + Bathroom Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Room Grid Visual */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)] animate-fade-in">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DoorOpen size={20} className="text-indigo-500" />
            แผนผังห้องพัก
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {rooms.map((room) => {
              const tenant = activeTenants.find(t => t.room_number === room.number);
              const statusColors: Record<string, string> = {
                occupied: 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20',
                available: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                maintenance: 'bg-amber-50 text-amber-700 border border-amber-200',
              };
              return (
                <div
                  key={room.id}
                  className={`relative rounded-xl p-3 text-center transition-all hover:scale-105 ${statusColors[room.status] || 'bg-gray-50 text-gray-700 border border-gray-200'}`}
                  title={tenant ? `${tenant.name} (${tenant.occupants || 1} คน)` : room.status === 'available' ? 'ว่าง' : 'ซ่อมบำรุง'}
                >
                  <span className="text-sm font-bold">{room.number}</span>
                  {tenant && (
                    <p className="text-[9px] mt-0.5 opacity-80 truncate">{tenant.name}</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500" />
              <span className="text-xs text-[var(--color-text-secondary)]">มีผู้เช่า</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
              <span className="text-xs text-[var(--color-text-secondary)]">ว่าง</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
              <span className="text-xs text-[var(--color-text-secondary)]">ซ่อมบำรุง</span>
            </div>
          </div>
        </div>

        {/* Bathroom Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)] animate-fade-in">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShowerHead size={20} className="text-cyan-500" />
            ห้องน้ำรวม
            <span className="text-xs font-normal bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full ml-auto">
              ผู้เข้าพักรวม {totalOccupants} คน
            </span>
          </h2>
          {bathrooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-muted)]">
              <ShowerHead size={40} className="mb-2 opacity-30" />
              <p className="text-sm">ยังไม่มีห้องน้ำรวม</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bathrooms.map((b) => {
                const bathroomOccupants = b.rooms.reduce((total, r) => {
                  const tenant = activeTenants.find(t => t.room_number === r.room_number);
                  return total + (tenant ? (tenant.occupants || 1) : 0);
                }, 0);
                return (
                  <div key={b.id} className="p-4 bg-cyan-50/60 rounded-xl border border-cyan-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                          <ShowerHead size={14} className="text-cyan-600" />
                        </div>
                        <span className="font-semibold text-sm text-[var(--color-text)]">{b.name}</span>
                      </div>
                      <span className="text-xs font-medium bg-cyan-100 text-cyan-700 px-2.5 py-1 rounded-full">
                        {bathroomOccupants} คน
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 ml-10">
                      {b.rooms.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">ยังไม่ได้กำหนดห้อง</span>
                      ) : b.rooms.map(r => (
                        <span key={r.room_id} className="text-xs bg-white text-cyan-700 px-2.5 py-0.5 rounded-full border border-cyan-200">
                          ห้อง {r.room_number}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/meters" className="group bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={20} />
                <span className="font-semibold">จดมิเตอร์</span>
              </div>
              <p className="text-xs opacity-80">บันทึกค่าไฟ ค่าน้ำก๊อก ค่าน้ำรวม</p>
            </div>
            <ArrowRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
        <Link href="/billing" className="group bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Receipt size={20} />
                <span className="font-semibold">บิลรายเดือน</span>
              </div>
              <p className="text-xs opacity-80">คำนวณและจัดการบิลค่าเช่า</p>
            </div>
            <ArrowRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
        <Link href="/settings" className="group bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Droplets size={20} />
                <span className="font-semibold">ตั้งค่าระบบ</span>
              </div>
              <p className="text-xs opacity-80">อัตราค่าไฟ ค่าน้ำ ห้องน้ำรวม</p>
            </div>
            <ArrowRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  );
}

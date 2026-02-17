'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    DoorOpen,
    Users,
    Gauge,
    Receipt,
    Settings,
    Home,
    Menu,
    X,
    MapPinned,
    BarChart3,
    History
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { href: '/', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { href: '/rooms', label: 'ห้องพัก', icon: DoorOpen },
    { href: '/tenants', label: 'ผู้เช่า', icon: Users },
    { href: '/meters', label: 'จดมิเตอร์', icon: Gauge },
    { href: '/floorplan', label: 'แผนผังห้อง', icon: MapPinned },
    { href: '/billing', label: 'บิลรายเดือน', icon: Receipt },
    { href: '/history', label: 'ประวัติชำระ', icon: History },
    { href: '/report', label: 'รายงาน', icon: BarChart3 },
    { href: '/settings', label: 'ตั้งค่า', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden bg-[var(--color-sidebar-bg)] text-white p-2 rounded-lg shadow-lg"
            >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-64 bg-[var(--color-sidebar-bg)] text-[var(--color-sidebar-text)] flex flex-col z-40 shadow-2xl
          max-lg:transition-transform max-lg:duration-300
          ${mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
        `}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Home size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-white tracking-wide">HomeyStay</h1>
                        <p className="text-xs text-slate-400">ระบบจัดการห้องเช่า</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium no-underline
                  ${isActive
                                        ? 'bg-[var(--color-sidebar-active)] text-white shadow-lg shadow-indigo-500/30'
                                        : 'text-slate-300 hover:bg-white/8 hover:text-white'
                                    }
                `}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/10">
                    <p className="text-xs text-slate-500">© 2026 HomeyStay</p>
                </div>
            </aside>
        </>
    );
}

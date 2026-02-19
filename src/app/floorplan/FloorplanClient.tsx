'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Map, DoorOpen, ShowerHead, Save, Eye, Pencil, ChevronDown, GripVertical, Trash2, RotateCcw, Maximize2, Grid3X3 } from 'lucide-react';

interface Room {
    id: number;
    number: string;
    floor: number;
    monthly_rent: number;
    status: string;
}

interface Invoice {
    id: number;
    room_id: number;
    room_number: string;
    month: string;
    rent: number;
    electric_cost: number;
    water_faucet_cost: number;
    water_shared_cost: number;
    total_amount: number;
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

interface FloorPlanPosition {
    id?: number;
    item_type: 'room' | 'bathroom';
    item_id: number;
    pos_x: number;
    pos_y: number;
    width: number;
    height: number;
    floor: number;
    item_name?: string;
    room_status?: string;
    item_floor?: number;
}

interface FloorPlanPageProps {
    initialRooms: Room[];
    initialBathrooms: Bathroom[];
    initialTenants: Tenant[];
    initialPositions: FloorPlanPosition[];
    initialInvoices: Invoice[];
}

export default function FloorPlanPage({ initialRooms, initialBathrooms, initialTenants, initialPositions, initialInvoices }: FloorPlanPageProps) {
    const [rooms] = useState<Room[]>(initialRooms);
    const [bathrooms] = useState<Bathroom[]>(initialBathrooms);
    const [tenants] = useState<Tenant[]>(initialTenants);
    const [positions, setPositions] = useState<FloorPlanPosition[]>(initialPositions);
    const [invoices] = useState<Invoice[]>(initialInvoices);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState(1);
    const [floorDropdownOpen, setFloorDropdownOpen] = useState(false);
    const [dragging, setDragging] = useState<{ type: 'room' | 'bathroom'; id: number; offsetX: number; offsetY: number } | null>(null);
    const [resizing, setResizing] = useState<{ type: 'room' | 'bathroom'; id: number; startX: number; startY: number; startW: number; startH: number } | null>(null);
    const [hoveredRoom, setHoveredRoom] = useState<number | null>(null);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Snap to grid helper (2% grid = ~50 snap points)
    const GRID_SIZE = 2;
    const snapToGrid = (val: number) => snapEnabled ? Math.round(val / GRID_SIZE) * GRID_SIZE : val;

    // Available floors
    const floors = [...new Set(rooms.map(r => r.floor))].sort();

    // Rooms on selected floor that ARE placed on canvas
    const placedRoomIds = positions.filter(p => p.item_type === 'room').map(p => p.item_id);
    const placedBathroomIds = positions.filter(p => p.item_type === 'bathroom').map(p => p.item_id);

    // Rooms on this floor NOT yet placed
    const unplacedRooms = rooms.filter(r => r.floor === selectedFloor && !placedRoomIds.includes(r.id));
    const unplacedBathrooms = bathrooms.filter(b => !placedBathroomIds.includes(b.id));

    // Positions for current floor
    const currentFloorPositions = positions.filter(p => {
        if (p.item_type === 'room') {
            const room = rooms.find(r => r.id === p.item_id);
            return room?.floor === selectedFloor;
        }
        return p.floor === selectedFloor;
    });

    const getTenantForRoom = (roomNumber: string) => {
        return tenants.find(t => t.is_active && t.room_number === roomNumber);
    };

    const getInvoiceForRoom = (roomNumber: string) => {
        return invoices.find(i => i.room_number === roomNumber);
    };

    // Handle drag from sidebar
    const handleSidebarDragStart = (e: React.DragEvent, type: 'room' | 'bathroom', id: number) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type, id, fromSidebar: true }));
        e.dataTransfer.effectAllowed = 'move';
    };

    // Handle canvas drag (moving existing items)
    const handleCanvasMouseDown = useCallback((e: React.MouseEvent, type: 'room' | 'bathroom', id: number) => {
        if (!editMode) return;
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const pos = positions.find(p => p.item_type === type && p.item_id === id);
        if (!pos) return;

        const itemX = (pos.pos_x / 100) * rect.width;
        const itemY = (pos.pos_y / 100) * rect.height;

        setDragging({
            type,
            id,
            offsetX: e.clientX - rect.left - itemX,
            offsetY: e.clientY - rect.top - itemY,
        });
    }, [editMode, positions]);

    // Mouse move on canvas (drag + resize)
    useEffect(() => {
        if (!dragging && !resizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            if (dragging) {
                const x = ((e.clientX - rect.left - dragging.offsetX) / rect.width) * 100;
                const y = ((e.clientY - rect.top - dragging.offsetY) / rect.height) * 100;

                const clampedX = Math.max(0, Math.min(92, x));
                const clampedY = Math.max(0, Math.min(92, y));

                setPositions(prev => prev.map(p =>
                    p.item_type === dragging.type && p.item_id === dragging.id
                        ? { ...p, pos_x: snapToGrid(clampedX), pos_y: snapToGrid(clampedY) }
                        : p
                ));
            }

            if (resizing) {
                const deltaX = ((e.clientX - resizing.startX) / rect.width) * 100;
                const deltaY = ((e.clientY - resizing.startY) / rect.height) * 100;

                const newW = Math.max(4, Math.min(40, resizing.startW + deltaX));
                const newH = Math.max(3, Math.min(30, resizing.startH + deltaY));

                setPositions(prev => prev.map(p =>
                    p.item_type === resizing.type && p.item_id === resizing.id
                        ? { ...p, width: snapToGrid(newW), height: snapToGrid(newH) }
                        : p
                ));
            }
        };

        const handleMouseUp = () => {
            setDragging(null);
            setResizing(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, resizing]);

    // Handle drop on canvas (from sidebar)
    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        const { type, id } = JSON.parse(data);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const clampedX = Math.max(0, Math.min(92, x));
        const clampedY = Math.max(0, Math.min(92, y));

        const snappedX = snapToGrid(clampedX);
        const snappedY = snapToGrid(clampedY);

        // Check if already placed
        const existing = positions.find(p => p.item_type === type && p.item_id === id);
        if (existing) {
            setPositions(prev => prev.map(p =>
                p.item_type === type && p.item_id === id
                    ? { ...p, pos_x: snappedX, pos_y: snappedY, floor: selectedFloor }
                    : p
            ));
        } else {
            setPositions(prev => [...prev, {
                item_type: type,
                item_id: id,
                pos_x: snappedX,
                pos_y: snappedY,
                width: 8,
                height: 6,
                floor: selectedFloor,
            }]);
        }
    };

    const handleCanvasDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // Resize handle
    const handleResizeMouseDown = (e: React.MouseEvent, type: 'room' | 'bathroom', id: number) => {
        if (!editMode) return;
        e.preventDefault();
        e.stopPropagation();
        const pos = positions.find(p => p.item_type === type && p.item_id === id);
        if (!pos) return;
        setResizing({
            type,
            id,
            startX: e.clientX,
            startY: e.clientY,
            startW: pos.width || 8,
            startH: pos.height || 6,
        });
    };

    // Remove from canvas
    const handleRemoveFromCanvas = async (type: 'room' | 'bathroom', id: number) => {
        setPositions(prev => prev.filter(p => !(p.item_type === type && p.item_id === id)));
        try {
            await fetch('/api/floorplan', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_type: type, item_id: id }),
            });
        } catch (err) {
            console.error('Failed to delete position:', err);
        }
    };

    // Save all positions
    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/floorplan', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ positions }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save:', err);
        }
        setSaving(false);
    };



    const statusColors: Record<string, { bg: string; border: string; text: string }> = {
        occupied: { bg: 'bg-indigo-500', border: 'border-indigo-400', text: 'text-white' },
        available: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800' },
        maintenance: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800' },
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">แผนผังห้องพัก</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">ลากวางห้องเพื่อจัดแผนผังตามตำแหน่งจริง</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Floor selector */}
                    <div className="relative">
                        <button
                            onClick={() => setFloorDropdownOpen(prev => !prev)}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer"
                        >
                            ชั้น {selectedFloor}
                            <ChevronDown size={14} />
                        </button>
                        {floorDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setFloorDropdownOpen(false)} />
                                <div className="absolute top-full mt-1 right-0 z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[100px]">
                                    {floors.map(f => (
                                        <button
                                            key={f}
                                            onClick={() => { setSelectedFloor(f); setFloorDropdownOpen(false); }}
                                            className={`w-full px-4 py-2 text-sm text-left hover:bg-indigo-50 cursor-pointer ${selectedFloor === f ? 'bg-indigo-50 text-indigo-600 font-semibold' : ''}`}
                                        >
                                            ชั้น {f}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* View/Edit toggle */}
                    <button
                        onClick={() => setEditMode(prev => !prev)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${editMode
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                            : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-50'
                            }`}
                    >
                        {editMode ? <Pencil size={16} /> : <Eye size={16} />}
                        <span className="hidden sm:inline">{editMode ? 'โหมดแก้ไข' : 'โหมดดู'}</span>
                    </button>

                    {/* Save */}
                    {editMode && (
                        <>
                            {/* Snap toggle */}
                            <button
                                onClick={() => setSnapEnabled(prev => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${snapEnabled
                                    ? 'bg-violet-100 text-violet-700 border border-violet-300'
                                    : 'bg-white border border-[var(--color-border)] text-gray-400 hover:bg-gray-50'
                                    }`}
                                title={snapEnabled ? 'Snap เปิด' : 'Snap ปิด'}
                            >
                                <Grid3X3 size={16} />
                                <span className="hidden sm:inline">Snap</span>
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/30 disabled:opacity-50 cursor-pointer"
                            >
                                <Save size={16} />
                                {saving ? 'บันทึก...' : 'บันทึก'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Success Toast */}
            {saved && (
                <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out]">
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald-600 text-white rounded-xl shadow-2xl shadow-emerald-600/30">
                        ✅ <span className="font-medium">บันทึกแผนผังเรียบร้อยแล้ว</span>
                    </div>
                </div>
            )}

            {/* Main Layout */}
            <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: '400px' }}>
                {/* Canvas */}
                <div
                    ref={canvasRef}
                    className={`flex-1 min-h-[50vh] lg:min-h-0 bg-white rounded-2xl border-2 relative transition-colors ${editMode
                        ? 'border-indigo-300 border-dashed overflow-hidden'
                        : 'border-[var(--color-border)] overflow-visible'
                        }`}
                    style={{
                        backgroundImage: editMode
                            ? 'radial-gradient(circle, #e0e7ff 1px, transparent 1px)'
                            : 'radial-gradient(circle, #f1f5f9 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                    onDrop={editMode ? handleCanvasDrop : undefined}
                    onDragOver={editMode ? handleCanvasDragOver : undefined}
                >
                    {/* Floor label */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-gray-200">
                        <Map size={14} className="text-indigo-500" />
                        <span className="text-xs font-semibold text-[var(--color-text)]">ชั้น {selectedFloor}</span>
                    </div>

                    {/* Empty state */}
                    {currentFloorPositions.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                            <Map size={48} className="mb-3 opacity-20" />
                            <p className="text-sm font-medium">ยังไม่มีห้องบนชั้นนี้</p>
                            <p className="text-xs mt-1">{editMode ? 'ลากห้องจากแถบด้านขวามาวางที่นี่' : 'เปิดโหมดแก้ไขเพื่อเริ่มวางห้อง'}</p>
                        </div>
                    )}

                    {/* Placed items */}
                    {currentFloorPositions.map(pos => {
                        if (pos.item_type === 'room') {
                            const room = rooms.find(r => r.id === pos.item_id);
                            if (!room) return null;
                            const tenant = getTenantForRoom(room.number);
                            const colors = statusColors[room.status] || statusColors.available;

                            return (
                                <div
                                    key={`room-${pos.item_id}`}
                                    className={`absolute select-none ${editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                                    style={{
                                        left: `${pos.pos_x}%`,
                                        top: `${pos.pos_y}%`,
                                        width: `${pos.width || 8}%`,
                                        height: `${pos.height || 6}%`,
                                        minWidth: '60px',
                                        minHeight: '40px',
                                        transition: (dragging?.type === 'room' && dragging?.id === pos.item_id) || (resizing?.type === 'room' && resizing?.id === pos.item_id) ? 'none' : 'all 0.1s ease-out',
                                        zIndex: hoveredRoom === room.id ? 50 : 1,
                                    }}
                                    onMouseDown={(e) => handleCanvasMouseDown(e, 'room', pos.item_id)}
                                    onMouseEnter={() => !editMode && setHoveredRoom(room.id)}
                                    onMouseLeave={() => setHoveredRoom(null)}
                                >
                                    {/* Tooltip — view mode only */}
                                    {!editMode && hoveredRoom === room.id && (() => {
                                        const invoice = getInvoiceForRoom(room.number);
                                        const waterTotal = parseFloat(String(invoice?.water_faucet_cost || 0)) + parseFloat(String(invoice?.water_shared_cost || 0));
                                        return (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-fade-in">
                                                <div className="bg-gray-900 text-white rounded-xl px-4 py-3 shadow-2xl min-w-[180px] text-xs whitespace-nowrap">
                                                    <div className="font-semibold text-sm mb-2 border-b border-white/20 pb-1.5">ห้อง {room.number}</div>
                                                    {tenant ? (
                                                        <>
                                                            <div className="flex justify-between gap-4 mb-1">
                                                                <span className="text-gray-400">ผู้เช่า</span>
                                                                <span className="font-medium">{tenant.name}</span>
                                                            </div>
                                                            <div className="flex justify-between gap-4 mb-1">
                                                                <span className="text-gray-400">จำนวน</span>
                                                                <span>{tenant.occupants || 1} คน</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-gray-400 mb-1">
                                                            {room.status === 'maintenance' ? '🔧 ซ่อมบำรุง' : '— ว่าง —'}
                                                        </div>
                                                    )}
                                                    <div className="border-t border-white/10 mt-1.5 pt-1.5 space-y-1">
                                                        <div className="flex justify-between gap-4">
                                                            <span className="text-gray-400">🏠 ค่าเช่า</span>
                                                            <span>฿{parseFloat(String(room.monthly_rent || 0)).toLocaleString()}</span>
                                                        </div>
                                                        {invoice ? (
                                                            <>
                                                                <div className="flex justify-between gap-4">
                                                                    <span className="text-yellow-400">⚡ ค่าไฟ</span>
                                                                    <span>฿{parseFloat(String(invoice.electric_cost || 0)).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-4">
                                                                    <span className="text-cyan-400">💧 ค่าน้ำ</span>
                                                                    <span>฿{waterTotal.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-4 border-t border-white/10 pt-1 mt-1 font-semibold">
                                                                    <span>รวม</span>
                                                                    <span className="text-emerald-400">฿{parseFloat(String(invoice.total_amount || 0)).toLocaleString()}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-gray-500 text-[10px]">ยังไม่มีบิลเดือนนี้</div>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Arrow */}
                                                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-gray-900 rotate-45" />
                                            </div>
                                        );
                                    })()}

                                    <div className={`${colors.bg} ${colors.text} border ${colors.border} rounded-xl shadow-md hover:shadow-lg transition-shadow w-full h-full flex flex-col items-center justify-center text-center relative group`}>
                                        {editMode && (
                                            <div className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <GripVertical size={12} className="text-gray-400" />
                                            </div>
                                        )}
                                        {editMode && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveFromCanvas('room', pos.item_id); }}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 z-10"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        )}
                                        <div className="text-sm font-bold">{room.number}</div>
                                        {tenant && (
                                            <div className="text-[9px] opacity-80 truncate max-w-[90%]">{tenant.name}</div>
                                        )}
                                        {!tenant && room.status === 'available' && (
                                            <div className="text-[9px] opacity-60">ว่าง</div>
                                        )}
                                        {room.status === 'maintenance' && (
                                            <div className="text-[9px] opacity-60">ซ่อมบำรุง</div>
                                        )}
                                        {/* Resize handle */}
                                        {editMode && (
                                            <div
                                                onMouseDown={(e) => handleResizeMouseDown(e, 'room', pos.item_id)}
                                                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <Maximize2 size={8} className="text-gray-400 rotate-90" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        if (pos.item_type === 'bathroom') {
                            const bathroom = bathrooms.find(b => b.id === pos.item_id);
                            if (!bathroom) return null;

                            return (
                                <div
                                    key={`bathroom-${pos.item_id}`}
                                    className={`absolute select-none ${editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                                    style={{
                                        left: `${pos.pos_x}%`,
                                        top: `${pos.pos_y}%`,
                                        width: `${pos.width || 8}%`,
                                        height: `${pos.height || 6}%`,
                                        minWidth: '60px',
                                        minHeight: '40px',
                                        transition: (dragging?.type === 'bathroom' && dragging?.id === pos.item_id) || (resizing?.type === 'bathroom' && resizing?.id === pos.item_id) ? 'none' : 'all 0.1s ease-out'
                                    }}
                                    onMouseDown={(e) => handleCanvasMouseDown(e, 'bathroom', pos.item_id)}
                                >
                                    <div className="bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-xl shadow-md hover:shadow-lg transition-shadow w-full h-full flex flex-col items-center justify-center text-center relative group">
                                        {editMode && (
                                            <div className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <GripVertical size={12} className="text-gray-400" />
                                            </div>
                                        )}
                                        {editMode && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveFromCanvas('bathroom', pos.item_id); }}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 z-10"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        )}
                                        <ShowerHead size={14} className="mx-auto mb-0.5 text-cyan-600" />
                                        <div className="text-xs font-bold">{bathroom.name}</div>
                                        <div className="text-[9px] opacity-60">{bathroom.rooms.length} ห้อง</div>
                                        {/* Resize handle */}
                                        {editMode && (
                                            <div
                                                onMouseDown={(e) => handleResizeMouseDown(e, 'bathroom', pos.item_id)}
                                                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <Maximize2 size={8} className="text-gray-400 rotate-90" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>

                {/* Sidebar — always rendered to maintain consistent canvas size */}
                <div className="w-full lg:w-52 flex-shrink-0 bg-white rounded-2xl border border-[var(--color-border)] p-4 overflow-y-auto lg:max-h-[calc(100vh-180px)]">
                    {editMode ? (
                        <>
                            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                                <RotateCcw size={14} className="text-indigo-500" />
                                ยังไม่ได้วาง
                            </h3>

                            {/* Unplaced rooms */}
                            {unplacedRooms.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">ห้องพัก</p>
                                    <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                                        {unplacedRooms.map(room => {
                                            const colors = statusColors[room.status] || statusColors.available;
                                            return (
                                                <div
                                                    key={room.id}
                                                    draggable
                                                    onDragStart={(e) => handleSidebarDragStart(e, 'room', room.id)}
                                                    className={`${colors.bg} ${colors.text} border ${colors.border} rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing text-center text-sm font-bold hover:shadow-md transition-shadow flex-shrink-0`}
                                                >
                                                    {room.number}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Unplaced bathrooms */}
                            {unplacedBathrooms.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">ห้องน้ำรวม</p>
                                    <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                                        {unplacedBathrooms.map(b => (
                                            <div
                                                key={b.id}
                                                draggable
                                                onDragStart={(e) => handleSidebarDragStart(e, 'bathroom', b.id)}
                                                className="bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing text-center hover:shadow-md transition-shadow"
                                            >
                                                <ShowerHead size={14} className="mx-auto mb-0.5 text-cyan-600" />
                                                <div className="text-xs font-bold">{b.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {unplacedRooms.length === 0 && unplacedBathrooms.length === 0 && (
                                <div className="text-center py-6 text-[var(--color-text-muted)]">
                                    <DoorOpen size={24} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">วางครบทุกห้องแล้ว 🎉</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                                <Map size={14} className="text-indigo-500" />
                                สรุปแผนผัง
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-indigo-600">{currentFloorPositions.filter(p => p.item_type === 'room').length}</p>
                                    <p className="text-[10px] text-indigo-500">ห้องพักบนชั้นนี้</p>
                                </div>
                                <div className="bg-cyan-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-cyan-600">{currentFloorPositions.filter(p => p.item_type === 'bathroom').length}</p>
                                    <p className="text-[10px] text-cyan-500">ห้องน้ำรวม</p>
                                </div>
                                <div className="col-span-2 lg:col-span-1 pt-2 border-t border-gray-100">
                                    <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">สัญลักษณ์</p>
                                    <div className="flex flex-wrap lg:flex-col gap-x-4 gap-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded bg-indigo-500 flex-shrink-0" />
                                            <span className="text-[11px] text-[var(--color-text-secondary)]">มีผู้เช่า</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 flex-shrink-0" />
                                            <span className="text-[11px] text-[var(--color-text-secondary)]">ว่าง</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 flex-shrink-0" />
                                            <span className="text-[11px] text-[var(--color-text-secondary)]">ซ่อมบำรุง</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded bg-cyan-100 border border-cyan-200 flex-shrink-0" />
                                            <span className="text-[11px] text-[var(--color-text-secondary)]">ห้องน้ำรวม</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Spacing */}
            <div className="h-4" />
        </div>
    );
}

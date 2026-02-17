# HomeyStay — Developer Handoff

> ระบบจัดการหอพัก (Apartment Management System)
> **Repo:** https://github.com/iEel/homeystay.git

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 16** (App Router) |
| Language | TypeScript / React 19 |
| Styling | **Tailwind CSS 4** |
| Database | **PostgreSQL** (via `pg` library) |
| Icons | `lucide-react` |
| Timezone | Custom Bangkok timezone utility |

---

## Quick Start

```bash
git clone https://github.com/iEel/homeystay.git
cd homeystay
npm install

# ตั้งค่า .env
echo "DATABASE_URL=postgresql://user:pass@host:5432/dbname" > .env

# สร้าง database schema
psql $DATABASE_URL -f src/lib/schema.sql

# รัน migrations (ถ้า DB มีอยู่แล้ว)
node scripts/migrate-override.js
node scripts/migrate-extra-units.js
node scripts/migrate-bathrooms.js
node scripts/migrate-occupants.js
node scripts/migrate-floorplan.js
node scripts/migrate-floorplan-resize.js
node scripts/migrate-alert-thresholds.js

# เริ่ม dev server
npm run dev        # http://localhost:3000
```

---

## Project Structure

```
homeystay/
├── .env                          # DATABASE_URL
├── scripts/                      # DB migration scripts
│   ├── setup-db.js
│   ├── migrate-override.js       # Override meter readings
│   ├── migrate-extra-units.js    # Extra units per room
│   ├── migrate-bathrooms.js      # Shared bathrooms
│   ├── migrate-occupants.js      # Occupant count
│   ├── migrate-floorplan.js      # Floor plan positions
│   ├── migrate-floorplan-resize.js
│   └── migrate-alert-thresholds.js  # Alert threshold settings
│
├── src/
│   ├── lib/
│   │   ├── db.ts                 # PostgreSQL pool (process.env.DATABASE_URL)
│   │   ├── meter.ts              # calcMeterUnits(), isRollover()
│   │   ├── timezone.ts           # Bangkok timezone helpers
│   │   └── schema.sql            # Full DB schema + seed data
│   │
│   ├── components/
│   │   ├── Sidebar.tsx           # App navigation sidebar
│   │   ├── Modal.tsx             # Reusable modal dialog
│   │   ├── StatCard.tsx          # Dashboard stat card
│   │   └── Toast.tsx             # Toast notifications (success/error/warning)
│   │
│   └── app/
│       ├── layout.tsx            # Root layout + Sidebar
│       ├── globals.css           # Global styles + animations
│       ├── page.tsx              # 📊 Dashboard (overview + 6-month chart)
│       │
│       ├── rooms/page.tsx        # 🚪 Room management (CRUD)
│       ├── tenants/page.tsx      # 👤 Tenant management (CRUD)
│       ├── meters/page.tsx       # ⚡ Meter reading input
│       ├── billing/page.tsx      # 💰 Bill generation & status
│       ├── settings/page.tsx     # ⚙️ Rates, thresholds, bathrooms
│       ├── floorplan/page.tsx    # 🗺️ Drag-and-drop floor plan
│       ├── report/page.tsx       # 📄 Monthly report
│       │
│       └── api/                  # REST API routes
│           ├── rooms/route.ts        # GET, POST, PUT, DELETE
│           ├── tenants/route.ts      # GET, POST, PUT, DELETE
│           ├── meters/route.ts       # GET, POST
│           ├── billing/route.ts      # GET, POST (generate), PUT (status)
│           ├── settings/route.ts     # GET, PUT
│           ├── bathrooms/route.ts    # GET, POST, PUT, DELETE
│           ├── floorplan/route.ts    # GET, POST
│           ├── dashboard/route.ts    # GET (6-month summary)
│           └── report/route.ts       # GET
```

---

## Database Schema

```
rooms           → id, number, floor, monthly_rent, status
tenants         → id, name, phone, id_card, room_id (FK), move_in/out, occupants
meter_readings  → room_id (FK), month, electric_prev/curr, water_faucet_prev/curr, overrides
shared_bathroom_readings → bathroom_id, month, water_prev/curr, override
invoices        → room_id (FK), month, rent, electric/water costs, total, status
settings        → key/value pairs (rates, extra units, alert thresholds)
floor_plan_positions → item_type, item_id, pos_x/y, width/height, floor
bathrooms       → id, name (+ bathroom_rooms junction table)
```

### Settings Keys

| Key | Default | คำอธิบาย |
|-----|---------|---------|
| `electric_rate` | 8 | อัตราค่าไฟ (บาท/หน่วย) |
| `water_rate` | 18 | อัตราค่าน้ำ (บาท/หน่วย) |
| `electric_extra_units` | 0 | หน่วยไฟเพิ่มต่อห้อง |
| `water_extra_units` | 0 | หน่วยน้ำเพิ่มต่อห้อง |
| `electric_alert_units` | 100 | แจ้งเตือนเมื่อใช้ไฟเกิน (หน่วย) |
| `water_alert_units` | 100 | แจ้งเตือนเมื่อใช้น้ำเกิน (หน่วย) |

---

## Key Features

### Billing Flow
1. ผู้ใช้จดมิเตอร์ (`/meters`) → บันทึก prev/curr ทุกห้อง + ห้องน้ำรวม
2. กด "คำนวณบิล" (`/billing`) → สร้าง invoice อัตโนมัติจาก settings + meter readings
3. เปลี่ยนสถานะ pending → paid

### Meter Reading Extras
- **Override**: ปรับค่าหน่วยจริงด้วยมือ (override_electric_units / override_water_units)
- **Rollover detection**: ตรวจจับเมื่อ curr < prev (มิเตอร์วน)
- **Alert thresholds**: แจ้งเตือนเมื่อใช้เกินที่ตั้งค่าไว้ (ตั้งค่าได้ที่ `/settings`)

### Shared Water Billing
- ห้องน้ำรวม assign ให้หลายห้อง → คำนวณค่าน้ำรวมหารตามจำนวนผู้อยู่อาศัย

### Floor Plan
- Drag & drop วางห้อง + ห้องน้ำ บน canvas
- Resize ได้ / มี snap-to-grid / แยกตามชั้น
- Hover tooltip แสดงข้อมูลผู้เช่า + ค่าใช้จ่ายเดือนปัจจุบัน

---

## Error Handling Pattern

ใช้ `Toast` component สำหรับ user feedback ทั้ง success และ error:

```tsx
import Toast from '@/components/Toast';
import type { ToastType } from '@/components/Toast';

const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

// ใน API call
try {
    const res = await fetch('/api/...', { method: 'POST', ... });
    if (!res.ok) throw new Error('Server error');
    setToast({ message: 'สำเร็จ', type: 'success' });
} catch {
    setToast({ message: 'ไม่สำเร็จ', type: 'error' });
}

// ใน JSX
{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

---

## Known Notes

- ⚠️ Migration scripts ใน `scripts/` ใช้ **hardcoded connection string** — ต้องแก้ก่อนรันบน production
- ⚠️ ยังไม่มี authentication / authorization
- ⚠️ ยังไม่มี automated tests
- UI เป็นภาษาไทยทั้งหมด

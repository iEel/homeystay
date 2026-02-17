-- HomeyStay Database Schema

-- ลบตารางเก่า (ถ้ามี)
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS meter_readings CASCADE;
DROP TABLE IF EXISTS shared_bathroom_readings CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- ห้องพัก
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  number VARCHAR(10) UNIQUE NOT NULL,
  floor INT NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ผู้เช่า
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  id_card VARCHAR(20),
  room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
  move_in_date DATE NOT NULL,
  move_out_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- จดมิเตอร์ (ไฟ + น้ำก๊อก ต่อห้อง)
CREATE TABLE meter_readings (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  electric_prev DECIMAL(10,2) DEFAULT 0,
  electric_curr DECIMAL(10,2) DEFAULT 0,
  water_faucet_prev DECIMAL(10,2) DEFAULT 0,
  water_faucet_curr DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, month)
);

-- น้ำห้องน้ำรวม (เดือนละ 1 record)
CREATE TABLE shared_bathroom_readings (
  id SERIAL PRIMARY KEY,
  month VARCHAR(7) UNIQUE NOT NULL,
  water_prev DECIMAL(10,2) DEFAULT 0,
  water_curr DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- บิล
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  rent DECIMAL(10,2),
  electric_units DECIMAL(10,2),
  electric_cost DECIMAL(10,2),
  water_faucet_units DECIMAL(10,2),
  water_faucet_cost DECIMAL(10,2),
  water_shared_cost DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, month)
);

-- ตั้งค่าระบบ
CREATE TABLE settings (
  key VARCHAR(50) PRIMARY KEY,
  value VARCHAR(100) NOT NULL,
  label VARCHAR(100)
);

INSERT INTO settings (key, value, label) VALUES
  ('electric_rate', '8', 'อัตราค่าไฟฟ้า (บาท/หน่วย)'),
  ('water_rate', '18', 'อัตราค่าน้ำ (บาท/หน่วย)');

-- แผนผังห้องพัก (ตำแหน่ง drag & drop)
CREATE TABLE floor_plan_positions (
  id SERIAL PRIMARY KEY,
  item_type VARCHAR(20) NOT NULL,
  item_id INT NOT NULL,
  pos_x DECIMAL(5,2) NOT NULL,
  pos_y DECIMAL(5,2) NOT NULL,
  floor INT DEFAULT 1,
  UNIQUE(item_type, item_id)
);

-- ข้อมูลตัวอย่าง
INSERT INTO rooms (number, floor, monthly_rent, status) VALUES
  ('101', 1, 3500, 'occupied'),
  ('102', 1, 3500, 'occupied'),
  ('103', 1, 3500, 'available'),
  ('201', 2, 4000, 'occupied'),
  ('202', 2, 4000, 'available'),
  ('203', 2, 4000, 'maintenance'),
  ('301', 3, 4500, 'occupied'),
  ('302', 3, 4500, 'available');

INSERT INTO tenants (name, phone, id_card, room_id, move_in_date, is_active) VALUES
  ('สมชาย ใจดี', '081-234-5678', '1100100200300', 1, '2025-06-01', true),
  ('สมหญิง รักสวย', '089-876-5432', '1100100200301', 2, '2025-08-15', true),
  ('ประเสริฐ มั่งมี', '062-345-6789', '1100100200302', 4, '2025-10-01', true),
  ('วิภา สดใส', '095-111-2222', '1100100200303', 7, '2026-01-10', true);

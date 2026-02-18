jest.mock('@/lib/db', () => require('../mocks/db'));

import { GET, POST, PUT, DELETE } from '@/app/api/tenants/route';
import { createRequest, parseResponse } from '../helpers';
import { mockQuery } from '../mocks/db';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /api/tenants', () => {
    it('returns all tenants with room numbers', async () => {
        const tenants = [
            { id: 1, name: 'สมชาย', room_number: '101', is_active: true },
        ];
        mockQuery.mockResolvedValue({ rows: tenants });

        const res = await GET();
        const { data, status } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data).toEqual(tenants);
    });
});

describe('POST /api/tenants', () => {
    it('creates a tenant with valid data', async () => {
        const tenant = { id: 1, name: 'สมชาย', room_id: 1 };
        mockQuery.mockResolvedValue({ rows: [tenant] });

        const req = createRequest('POST', 'http://localhost/api/tenants', {
            name: 'สมชาย', phone: '0812345678', room_id: 1, move_in_date: '2025-01-01', occupants: 2,
        });
        const res = await POST(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(201);
        expect(data.name).toBe('สมชาย');
    });

    it('updates room status to occupied when room_id provided', async () => {
        mockQuery.mockResolvedValue({ rows: [{ id: 1, name: 'ทดสอบ', room_id: 5 }] });

        const req = createRequest('POST', 'http://localhost/api/tenants', {
            name: 'ทดสอบ', room_id: 5, move_in_date: '2025-01-01',
        });
        await POST(req);

        // Should have 2 queries: INSERT tenant + UPDATE room status
        expect(mockQuery).toHaveBeenCalledTimes(2);
        expect(mockQuery).toHaveBeenCalledWith(
            'UPDATE rooms SET status=$1 WHERE id=$2', ['occupied', 5]
        );
    });

    it('rejects missing name', async () => {
        const req = createRequest('POST', 'http://localhost/api/tenants', {
            phone: '0812345678',
        });
        const res = await POST(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(400);
        expect(data.error).toContain('ชื่อผู้เช่า');
    });

    it('rejects empty name', async () => {
        const req = createRequest('POST', 'http://localhost/api/tenants', {
            name: '   ',
        });
        const res = await POST(req);
        const { status } = await parseResponse(res);

        expect(status).toBe(400);
    });

    it('rejects invalid occupants', async () => {
        const req = createRequest('POST', 'http://localhost/api/tenants', {
            name: 'ทดสอบ', occupants: -1,
        });
        const res = await POST(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(400);
        expect(data.error).toContain('ผู้อยู่อาศัย');
    });
});

describe('PUT /api/tenants', () => {
    it('updates tenant with valid data', async () => {
        const updated = { id: 1, name: 'สมชาย (แก้ไข)', room_id: 1 };
        mockQuery
            .mockResolvedValueOnce({ rows: [{ room_id: 1 }] }) // SELECT old room_id
            .mockResolvedValueOnce({ rows: [updated] }) // UPDATE tenant
            .mockResolvedValueOnce({ rows: [] }); // UPDATE room occupied

        const req = createRequest('PUT', 'http://localhost/api/tenants', {
            id: 1, name: 'สมชาย (แก้ไข)', room_id: 1, move_in_date: '2025-01-01', is_active: true,
        });
        const res = await PUT(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data.name).toBe('สมชาย (แก้ไข)');
    });

    it('rejects missing ID', async () => {
        const req = createRequest('PUT', 'http://localhost/api/tenants', {
            name: 'ทดสอบ',
        });
        const res = await PUT(req);
        const { status } = await parseResponse(res);

        expect(status).toBe(400);
    });

    it('rejects missing name', async () => {
        const req = createRequest('PUT', 'http://localhost/api/tenants', {
            id: 1,
        });
        const res = await PUT(req);
        const { status } = await parseResponse(res);

        expect(status).toBe(400);
    });
});

describe('DELETE /api/tenants', () => {
    it('deletes a tenant and frees room', async () => {
        mockQuery
            .mockResolvedValueOnce({ rows: [{ room_id: 3 }] }) // SELECT room_id
            .mockResolvedValueOnce({ rows: [] }) // DELETE
            .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // SELECT COUNT remaining
            .mockResolvedValueOnce({ rows: [] }); // UPDATE room available

        const req = createRequest('DELETE', 'http://localhost/api/tenants?id=1');
        const res = await DELETE(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockQuery).toHaveBeenCalledWith(
            'UPDATE rooms SET status=$1 WHERE id=$2', ['available', 3]
        );
    });
});

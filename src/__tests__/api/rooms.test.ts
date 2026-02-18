jest.mock('@/lib/db', () => require('../mocks/db'));

import { GET, POST, PUT, DELETE } from '@/app/api/rooms/route';
import { createRequest, parseResponse } from '../helpers';
import { mockQuery } from '../mocks/db';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /api/rooms', () => {
    it('returns all rooms', async () => {
        const rooms = [
            { id: 1, number: '101', floor: 1, monthly_rent: 3000, status: 'available' },
            { id: 2, number: '102', floor: 1, monthly_rent: 3500, status: 'occupied' },
        ];
        mockQuery.mockResolvedValue({ rows: rooms });

        const res = await GET();
        const { data, status } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data).toEqual(rooms);
        expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM rooms ORDER BY number');
    });

    it('returns 500 on database error', async () => {
        mockQuery.mockRejectedValue(new Error('DB error'));

        const res = await GET();
        const { data, status } = await parseResponse(res);

        expect(status).toBe(500);
        expect(data.error).toBe('Failed to fetch rooms');
    });
});

describe('POST /api/rooms', () => {
    it('creates a room with valid data', async () => {
        const newRoom = { id: 1, number: '201', floor: 2, monthly_rent: 4000, status: 'available' };
        mockQuery.mockResolvedValue({ rows: [newRoom] });

        const req = createRequest('POST', 'http://localhost/api/rooms', {
            number: '201', floor: 2, monthly_rent: 4000,
        });
        const res = await POST(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(201);
        expect(data).toEqual(newRoom);
    });

    it('rejects missing room number', async () => {
        const req = createRequest('POST', 'http://localhost/api/rooms', {
            floor: 1, monthly_rent: 3000,
        });
        const res = await POST(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(400);
        expect(data.error).toContain('หมายเลขห้อง');
    });

    it('rejects empty room number', async () => {
        const req = createRequest('POST', 'http://localhost/api/rooms', {
            number: '  ', floor: 1, monthly_rent: 3000,
        });
        const res = await POST(req);
        const { status } = await parseResponse(res);

        expect(status).toBe(400);
    });

    it('rejects invalid floor', async () => {
        const req = createRequest('POST', 'http://localhost/api/rooms', {
            number: '101', floor: 0, monthly_rent: 3000,
        });
        const res = await POST(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(400);
        expect(data.error).toContain('ชั้น');
    });

    it('rejects negative monthly_rent', async () => {
        const req = createRequest('POST', 'http://localhost/api/rooms', {
            number: '101', floor: 1, monthly_rent: -500,
        });
        const res = await POST(req);
        const { status } = await parseResponse(res);

        expect(status).toBe(400);
    });

    it('rejects invalid status', async () => {
        const req = createRequest('POST', 'http://localhost/api/rooms', {
            number: '101', floor: 1, monthly_rent: 3000, status: 'invalid',
        });
        const res = await POST(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(400);
        expect(data.error).toContain('สถานะ');
    });

    it('defaults status to available', async () => {
        mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });

        const req = createRequest('POST', 'http://localhost/api/rooms', {
            number: '101', floor: 1, monthly_rent: 3000,
        });
        await POST(req);

        expect(mockQuery).toHaveBeenCalledWith(
            expect.any(String),
            ['101', 1, 3000, 'available']
        );
    });
});

describe('PUT /api/rooms', () => {
    it('updates a room with valid data', async () => {
        const updated = { id: 1, number: '101', floor: 2, monthly_rent: 4000, status: 'occupied' };
        mockQuery.mockResolvedValue({ rows: [updated] });

        const req = createRequest('PUT', 'http://localhost/api/rooms', {
            id: 1, number: '101', floor: 2, monthly_rent: 4000, status: 'occupied',
        });
        const res = await PUT(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data).toEqual(updated);
    });

    it('rejects missing ID', async () => {
        const req = createRequest('PUT', 'http://localhost/api/rooms', {
            number: '101', floor: 1, monthly_rent: 3000,
        });
        const res = await PUT(req);
        const { status } = await parseResponse(res);

        expect(status).toBe(400);
    });

    it('rejects invalid data', async () => {
        const req = createRequest('PUT', 'http://localhost/api/rooms', {
            id: 1, number: '', floor: 1, monthly_rent: 3000,
        });
        const res = await PUT(req);
        const { status } = await parseResponse(res);

        expect(status).toBe(400);
    });
});

describe('DELETE /api/rooms', () => {
    it('deletes a room by ID', async () => {
        mockQuery.mockResolvedValue({ rows: [] });

        const req = createRequest('DELETE', 'http://localhost/api/rooms?id=1');
        const res = await DELETE(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockQuery).toHaveBeenCalledWith('DELETE FROM rooms WHERE id=$1', ['1']);
    });
});

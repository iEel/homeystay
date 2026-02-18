jest.mock('@/lib/db', () => require('../mocks/db'));

import { GET, PUT } from '@/app/api/settings/route';
import { createRequest, parseResponse } from '../helpers';
import { mockQuery } from '../mocks/db';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /api/settings', () => {
    it('returns all settings as key-value object', async () => {
        const rows = [
            { key: 'electric_rate', value: '8', label: 'ค่าไฟต่อหน่วย' },
            { key: 'water_rate', value: '18', label: 'ค่าน้ำต่อหน่วย' },
        ];
        mockQuery.mockResolvedValue({ rows });

        const res = await GET();
        const { data, status } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data).toEqual({
            electric_rate: { value: '8', label: 'ค่าไฟต่อหน่วย' },
            water_rate: { value: '18', label: 'ค่าน้ำต่อหน่วย' },
        });
    });

    it('returns 500 on DB error', async () => {
        mockQuery.mockRejectedValue(new Error('DB error'));

        const res = await GET();
        const { status } = await parseResponse(res);

        expect(status).toBe(500);
    });
});

describe('PUT /api/settings', () => {
    it('updates settings with valid numeric values', async () => {
        mockQuery.mockResolvedValue({ rows: [] });

        const req = createRequest('PUT', 'http://localhost/api/settings', {
            electric_rate: '9',
            water_rate: '20',
        });
        const res = await PUT(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('rejects non-numeric values', async () => {
        const req = createRequest('PUT', 'http://localhost/api/settings', {
            electric_rate: 'abc',
        });
        const res = await PUT(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(400);
        expect(data.error).toContain('ตัวเลข');
    });

    it('accepts zero and decimal values', async () => {
        mockQuery.mockResolvedValue({ rows: [] });

        const req = createRequest('PUT', 'http://localhost/api/settings', {
            electric_rate: '0',
            water_rate: '18.5',
        });
        const res = await PUT(req);
        const { status } = await parseResponse(res);

        expect(status).toBe(200);
    });
});

jest.mock('@/lib/db', () => require('../mocks/db'));

import { GET, PUT } from '@/app/api/billing/route';
import { createRequest, parseResponse } from '../helpers';
import { mockQuery } from '../mocks/db';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /api/billing', () => {
    it('returns invoices for a specific month', async () => {
        const invoices = [
            { id: 1, room_number: '101', month: '2025-01', total_amount: 5000, status: 'paid' },
        ];
        mockQuery.mockResolvedValue({ rows: invoices });

        const req = createRequest('GET', 'http://localhost/api/billing?month=2025-01');
        const res = await GET(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data).toEqual(invoices);
        expect(mockQuery).toHaveBeenCalledWith(
            expect.stringContaining('WHERE i.month = $1'),
            ['2025-01']
        );
    });

    it('returns all invoices without month filter', async () => {
        mockQuery.mockResolvedValue({ rows: [] });

        const req = createRequest('GET', 'http://localhost/api/billing');
        const res = await GET(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data).toEqual([]);
    });
});

describe('PUT /api/billing', () => {
    it('updates invoice status', async () => {
        const updated = { id: 1, status: 'paid' };
        mockQuery.mockResolvedValue({ rows: [updated] });

        const req = createRequest('PUT', 'http://localhost/api/billing', {
            id: 1, status: 'paid',
        });
        const res = await PUT(req);
        const { data, status } = await parseResponse(res);

        expect(status).toBe(200);
        expect(data.status).toBe('paid');
    });

    it('returns 500 on DB error', async () => {
        mockQuery.mockRejectedValueOnce(new Error('DB error'));

        const req = createRequest('PUT', 'http://localhost/api/billing', {
            id: 999, status: 'paid',
        });
        const res = await PUT(req);
        const { status } = await parseResponse(res);

        expect(status).toBe(500);
    });
});

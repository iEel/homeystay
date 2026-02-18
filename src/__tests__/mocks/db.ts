// Mock for @/lib/db
const mockQuery = jest.fn();

const pool = {
    query: mockQuery,
};

export default pool;
export { mockQuery };

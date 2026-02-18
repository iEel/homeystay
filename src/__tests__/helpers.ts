/**
 * Helper to create a mock Request object for testing Next.js route handlers.
 */
export function createRequest(
    method: string,
    url: string = 'http://localhost:3000/api/test',
    body?: Record<string, unknown>
): Request {
    const init: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
        init.body = JSON.stringify(body);
    }
    return new Request(url, init);
}

/**
 * Parse NextResponse body as JSON.
 */
export async function parseResponse(response: Response) {
    const data = await response.json();
    return { data, status: response.status };
}

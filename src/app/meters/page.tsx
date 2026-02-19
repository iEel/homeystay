import MetersClient from './MetersClient';

export const dynamic = 'force-dynamic';

export default function MetersPage() {
    // Meters page has complex month-based data with prev/curr readings, history, 
    // shared bathroom readings, and settings. The client component manages all of this
    // via /api/meters with month navigation.
    return <MetersClient />;
}

import ReportClient from './ReportClient';

export const dynamic = 'force-dynamic';

export default function ReportPage() {
    // Report page has complex month-based data fetching with trend/floor/room aggregation
    // The client component handles all month navigation and data fetching via /api/report
    return <ReportClient />;
}

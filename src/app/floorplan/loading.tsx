'use client';

export default function FloorplanLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="h-8 w-36 bg-gray-200 rounded-lg" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm" style={{ height: '70vh' }}>
                <div className="h-full bg-gray-50 rounded-2xl" />
            </div>
        </div>
    );
}

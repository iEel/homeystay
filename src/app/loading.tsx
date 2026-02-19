'use client';

export default function DashboardLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="h-8 w-48 bg-gray-200 rounded-lg" />
            </div>

            {/* Stat cards skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                        <div className="h-8 w-16 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>

            {/* Chart skeleton */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
                <div className="h-64 bg-gray-100 rounded-xl" />
            </div>
        </div>
    );
}

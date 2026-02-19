'use client';

export default function BillingLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                    <div className="h-8 w-40 bg-gray-200 rounded-lg" />
                </div>
                <div className="flex gap-3">
                    <div className="w-40 h-10 bg-gray-200 rounded-xl" />
                    <div className="w-28 h-10 bg-gray-200 rounded-xl" />
                </div>
            </div>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                        <div className="h-7 w-24 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>
            {/* Invoice rows */}
            <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-5 w-24 bg-gray-200 rounded" />
                            <div className="h-4 w-36 bg-gray-200 rounded" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-20 bg-gray-200 rounded-full" />
                            <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

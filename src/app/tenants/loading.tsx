'use client';

export default function TenantsLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                    <div className="h-8 w-32 bg-gray-200 rounded-lg" />
                </div>
                <div className="w-28 h-10 bg-gray-200 rounded-xl" />
            </div>
            <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-5 w-32 bg-gray-200 rounded" />
                            <div className="h-4 w-48 bg-gray-200 rounded" />
                        </div>
                        <div className="h-6 w-16 bg-gray-200 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

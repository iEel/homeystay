'use client';

export default function RoomsLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                    <div className="h-8 w-32 bg-gray-200 rounded-lg" />
                </div>
                <div className="w-28 h-10 bg-gray-200 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex justify-between mb-3">
                            <div className="h-6 w-20 bg-gray-200 rounded" />
                            <div className="h-6 w-16 bg-gray-200 rounded-full" />
                        </div>
                        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                        <div className="h-5 w-28 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

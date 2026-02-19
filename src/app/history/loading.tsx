'use client';

export default function HistoryLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="h-8 w-36 bg-gray-200 rounded-lg" />
            </div>
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between mb-4">
                            <div className="h-6 w-28 bg-gray-200 rounded" />
                            <div className="h-5 w-20 bg-gray-200 rounded" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-gray-100 rounded" />
                            <div className="h-4 w-3/4 bg-gray-100 rounded" />
                            <div className="h-4 w-1/2 bg-gray-100 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

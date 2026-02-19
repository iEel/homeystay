'use client';

export default function MetersLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                    <div className="h-8 w-36 bg-gray-200 rounded-lg" />
                </div>
                <div className="flex gap-3">
                    <div className="w-40 h-10 bg-gray-200 rounded-xl" />
                    <div className="w-24 h-10 bg-gray-200 rounded-xl" />
                </div>
            </div>
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between mb-4">
                            <div className="h-6 w-24 bg-gray-200 rounded" />
                            <div className="h-6 w-16 bg-gray-200 rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="h-4 w-20 bg-gray-200 rounded" />
                                <div className="h-10 bg-gray-200 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-20 bg-gray-200 rounded" />
                                <div className="h-10 bg-gray-200 rounded-xl" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

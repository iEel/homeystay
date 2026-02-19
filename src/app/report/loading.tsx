'use client';

export default function ReportLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="h-8 w-28 bg-gray-200 rounded-lg" />
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 w-full bg-gray-100 rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    );
}

'use client';

export default function SettingsLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="h-8 w-28 bg-gray-200 rounded-lg" />
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 w-36 bg-gray-200 rounded" />
                        <div className="h-10 w-full bg-gray-200 rounded-xl" />
                    </div>
                ))}
                <div className="h-10 w-24 bg-gray-200 rounded-xl" />
            </div>
        </div>
    );
}

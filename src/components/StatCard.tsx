import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    trend?: string;
}

export default function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--color-border)] hover:shadow-md hover:-translate-y-0.5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon size={24} style={{ color }} />
                </div>
                {trend && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{label}</p>
        </div>
    );
}

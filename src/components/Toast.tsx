'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
}

const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
};

const styles = {
    success: 'bg-emerald-600 shadow-emerald-600/30',
    error: 'bg-red-600 shadow-red-600/30',
    warning: 'bg-amber-500 shadow-amber-500/30',
};

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const Icon = icons[type];

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className={`flex items-center gap-3 px-5 py-3.5 text-white rounded-xl shadow-2xl ${styles[type]}`}>
                <Icon size={20} />
                <span className="font-medium text-sm">{message}</span>
                <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

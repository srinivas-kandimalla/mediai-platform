import React from 'react';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { Badge } from './ui/CustomComponents';

interface AlertBannerProps {
  id: string;
  patientName: string;
  alertType: 'CRITICAL' | 'EMERGENCY' | 'MEDICATION' | 'LAB_REPORT';
  message: string;
  notifiedAt: string;
  isResolved: boolean;
  onResolve?: (id: string) => void;
  showResolveButton?: boolean;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  id,
  patientName,
  alertType,
  message,
  notifiedAt,
  isResolved,
  onResolve,
  showResolveButton = false,
}) => {
  const alertStyles = {
    CRITICAL: 'border-red-500 bg-red-50/70 dark:bg-red-950/20 text-red-900 dark:text-red-200',
    EMERGENCY: 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200',
    MEDICATION: 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200',
    LAB_REPORT: 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/20 text-teal-900 dark:text-teal-200',
  };

  return (
    <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 shadow-sm ${alertStyles[alertType]} ${!isResolved && (alertType === 'CRITICAL' || alertType === 'EMERGENCY') ? 'animate-pulse-subtle' : ''}`}>
      <div className="flex items-start gap-3.5">
        <ShieldAlert className="h-5.5 w-5.5 shrink-0 mt-0.5 text-clinical-rose" />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100">{patientName}</span>
            <Badge variant={alertType === 'CRITICAL' ? 'danger' : alertType === 'EMERGENCY' ? 'warning' : 'info'}>
              {alertType}
            </Badge>
          </div>
          <p className="text-xs mt-1 leading-relaxed text-slate-700 dark:text-slate-350">{message}</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-450 dark:text-slate-500">
            <Clock className="h-3 w-3" />
            <span>Logged: {new Date(notifiedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {showResolveButton && !isResolved && onResolve && (
        <button
          onClick={() => onResolve(id)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 flex items-center gap-1.5 self-end md:self-center transition-all shadow-sm shrink-0"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Mark Resolved
        </button>
      )}
    </div>
  );
};

import React from 'react';
import { Appointment } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Badge } from './ui/CustomComponents';
import { CalendarRange, Clock, User, Check, X, ShieldAlert } from 'lucide-react';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onStatusChange?: (id: string, newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => void;
  showActions?: boolean;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  onStatusChange,
  showActions = false,
  role,
}) => {
  const statusBadges = {
    PENDING: 'warning',
    CONFIRMED: 'success',
    CANCELLED: 'danger',
    COMPLETED: 'info',
  } as const;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-brand-600" />
          <span>Scheduled Checkups & Bookings</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
            No scheduled appointments found.
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-800/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 shrink-0 mt-0.5">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {new Date(appt.scheduledAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      <Badge variant={statusBadges[appt.status]} className="text-[9px] uppercase font-bold px-2.5">
                        {appt.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <User className="h-3.5 w-3.5" />
                      <span>
                        {role === 'PATIENT'
                          ? `Doctor: Dr. ${appt.doctor?.user?.name || 'Assigned Specialist'}`
                          : `Patient: ${appt.patient?.user?.name || 'Assigned Patient'}`}
                      </span>
                    </p>

                    {appt.notes && (
                      <p className="text-[11px] text-slate-450 dark:text-slate-500 italic mt-1 leading-relaxed">
                        &ldquo;{appt.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Confirm / Decline Action Buttons */}
                {showActions && appt.status === 'PENDING' && onStatusChange && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onStatusChange(appt.id, 'CONFIRMED')}
                      className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-100 transition-colors"
                      title="Approve Appointment"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onStatusChange(appt.id, 'CANCELLED')}
                      className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-clinical-rose hover:bg-red-100 transition-colors"
                      title="Decline Appointment"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertBanner } from '../components/AlertBanner';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/CustomComponents';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AdminAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/alerts');
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id: string) => {
    setSuccessMsg(null);
    try {
      const res = await api.put(`/alerts/${id}/resolve`);
      if (res.data.success) {
        setSuccessMsg(`Emergency alert cleared.`);
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeAlerts = alerts.filter((a) => !a.isResolved);
  const resolvedAlerts = alerts.filter((a) => a.isResolved);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Active Emergency Alerts</h2>
        <p className="text-xs text-slate-500 mt-1">Resolve emergency alarms triggered by patient vital thresholds or lab report abnormal findings</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading alerts telemetry...</div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Active Alarms */}
          <div className="space-y-3">
            <h4 className="text-[10px] uppercase font-bold text-clinical-rose tracking-wider flex items-center gap-1">
              <ShieldAlert className="h-4 w-4 shrink-0 animate-pulse-subtle" />
              <span>Active Emergency Queue ({activeAlerts.length})</span>
            </h4>
            {activeAlerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                ✅ All emergency alarms cleared. System operational.
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <AlertBanner
                  key={alert.id}
                  id={alert.id}
                  patientName={alert.patient?.user?.name || 'Patient'}
                  alertType={alert.alertType}
                  message={alert.message}
                  notifiedAt={alert.notifiedAt}
                  isResolved={alert.isResolved}
                  showResolveButton={true}
                  onResolve={handleResolve}
                />
              ))
            )}
          </div>

          {/* Historic Resolved */}
          {resolvedAlerts.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/40">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Historic Resolved Alerts ({resolvedAlerts.length})
              </h4>
              <div className="space-y-2 opacity-65">
                {resolvedAlerts.slice(0, 5).map((alert) => (
                  <AlertBanner
                    key={alert.id}
                    id={alert.id}
                    patientName={alert.patient?.user?.name || 'Patient'}
                    alertType={alert.alertType}
                    message={alert.message}
                    notifiedAt={alert.notifiedAt}
                    isResolved={alert.isResolved}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

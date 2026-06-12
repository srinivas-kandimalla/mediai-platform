import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { AlertBanner } from '../components/AlertBanner';
import { AppointmentCalendar } from '../components/AppointmentCalendar';
import { Heart, Activity, Calendar, Award, Sparkles, Brain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!user?.profileId) return;
    setIsLoading(true);
    try {
      // Fetch stats
      const statsRes = await api.get(`/analytics/patient-dashboard/${user.profileId}`);
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      // Fetch appointments
      const apptsRes = await api.get(`/patients/${user.profileId}/appointments`);
      if (apptsRes.data.success) {
        setAppointments(apptsRes.data.data.slice(0, 3)); // Display next 3
      }

      // Fetch alerts
      const alertsRes = await api.get('/alerts');
      if (alertsRes.data.success) {
        // Filter alerts belonging to this patient
        const filtered = alertsRes.data.data.filter((a: any) => a.patientId === user.profileId && !a.isResolved);
        setAlerts(filtered);
      }
    } catch (err) {
      console.error('Failed to load patient dashboard metrics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <svg className="animate-spin h-6 w-6 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Syncing dashboard data...</span>
      </div>
    );
  }

  // Format Recharts data (reverse to show chronological trends)
  const chartData = stats.recentPredictions
    ? [...stats.recentPredictions].reverse().map((p: any) => ({
        date: new Date(p.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        risk: Math.round(p.riskScore * 100),
        disease: p.disease,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Patient Clinical Console</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time health prognostic metrics and appointment scheduling</p>
        </div>
        <div className="bg-brand-950/40 border border-brand-900/30 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500 animate-pulse-subtle" />
          <span className="text-xs font-semibold text-brand-400">MediAI Prognostics Active</span>
        </div>
      </div>

      {/* Emergency active alarms banner stack */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-clinical-rose">Active Vital Threshold Alerts</h4>
          {alerts.map((alert) => (
            <AlertBanner
              key={alert.id}
              id={alert.id}
              patientName={user?.name || 'Patient'}
              alertType={alert.alertType}
              message={alert.message}
              notifiedAt={alert.notifiedAt}
              isResolved={alert.isResolved}
            />
          ))}
        </div>
      )}

      {/* Metric Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Consultations"
          value={stats.appointmentsCount}
          description="Doctor visits scheduled"
          icon={Calendar}
          color="primary"
        />
        <MetricCard
          title="AI Risk Predicts"
          value={stats.predictionsCount}
          description="Symptom screenings run"
          icon={Brain}
          color="success"
        />
        <MetricCard
          title="Active Emergencies"
          value={stats.activeAlerts}
          description="Unresolved vital warning flags"
          icon={Activity}
          color={stats.activeAlerts > 0 ? 'danger' : 'primary'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Prognosis Plot */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-brand-555" />
              <span>Diagnostic Risk Score Trends</span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Historical risk ratings from clinical symptom classifier</p>
          </div>

          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Run AI Symptom screenings to view health charts.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3042" vertical={false} />
                  <XAxis dataKey="date" stroke="#8c909a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#8c909a" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 8, fontSize: 11 }}
                    labelClassName="font-bold text-white"
                  />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Next doctor visits */}
        <div className="lg:col-span-1">
          <AppointmentCalendar
            appointments={appointments}
            role="PATIENT"
            showActions={false}
          />
        </div>
      </div>
    </div>
  );
};

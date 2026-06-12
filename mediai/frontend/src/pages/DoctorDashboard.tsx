import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { AppointmentCalendar } from '../components/AppointmentCalendar';
import { Users, Calendar, Activity, ClipboardCheck, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/CustomComponents';
import { useNavigate } from 'react-router-dom';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user?.profileId) return;
    setIsLoading(true);
    try {
      const statsRes = await api.get(`/analytics/doctor-dashboard/${user.profileId}`);
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      const apptsRes = await api.get(`/doctors/${user.profileId}/appointments`);
      if (apptsRes.data.success) {
        setAppointments(apptsRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <svg className="animate-spin h-6 w-6 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Loading clinical stats...</span>
      </div>
    );
  }

  const handleStatusChange = async (id: string, newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    try {
      const res = await api.put(`/appointments/${id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchDashboardData(); // Reload
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Clinical Operations Console</h2>
          <p className="text-xs text-slate-500 mt-1">Review scheduled checkups, assigned patients, and critical telemetry warnings</p>
        </div>
      </div>

      {/* Stats counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Assigned Patients"
          value={stats.assignedPatientsCount}
          description="EHR records mapped"
          icon={Users}
          color="primary"
        />
        <MetricCard
          title="Today's Bookings"
          value={stats.appointmentsCount}
          description="Total visits scheduled"
          icon={Calendar}
          color="success"
        />
        <MetricCard
          title="Pending Approvals"
          value={stats.pendingAppointments}
          description="Requests waiting approval"
          icon={ClipboardCheck}
          color={stats.pendingAppointments > 0 ? 'warning' : 'primary'}
        />
        <MetricCard
          title="Critical Alarms"
          value={stats.activeCriticalAlerts}
          description="Unresolved vital checks"
          icon={Activity}
          color={stats.activeCriticalAlerts > 0 ? 'danger' : 'primary'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments calendar with actions */}
        <div className="lg:col-span-2">
          <AppointmentCalendar
            appointments={appointments}
            role="DOCTOR"
            showActions={true}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Quick links & Upcoming queue */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-brand-600" />
                <span>Clinical Shortcuts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <button
                onClick={() => navigate('/doctor/patients')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 font-semibold hover:border-brand-500 transition-colors"
              >
                🔍 Browse Assigned Patients & EHRs
              </button>
              <button
                onClick={() => navigate('/doctor/predictions')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 font-semibold hover:border-brand-500 transition-colors"
              >
                🧠 Inspect AI Patient Disease Risks
              </button>
              <button
                onClick={() => navigate('/doctor/recommendations')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 font-semibold hover:border-brand-500 transition-colors"
              >
                📝 Prescribe Treatment Recommendations
              </button>
              <button
                onClick={() => navigate('/doctor/reports')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 font-semibold hover:border-brand-500 transition-colors"
              >
                🔬 Analyze Lab Reports & Telemetry
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

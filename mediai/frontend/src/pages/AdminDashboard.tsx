import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/CustomComponents';
import { Bed, DollarSign, Activity, Calendar, ShieldCheck, HeartPulse, ShieldAlert, BarChart } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/analytics/admin-dashboard');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <svg className="animate-spin h-6 w-6 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Loading operations analytics...</span>
      </div>
    );
  }

  const { kpis, resources, diseaseSummary } = stats;

  // Format resource levels data for Recharts Bar Chart
  const resourceData = resources
    ? resources.map((r: any) => ({
        name: r.resourceType,
        Total: r.totalUnits,
        Available: r.availableUnits,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Hospital Administration Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time bed availability rates, inventory telemetry, and diagnostic analytics</p>
        </div>
      </div>

      {/* KPI stats rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard
          title="Bed Occupancy Rate"
          value={`${kpis.bedOccupancyRate}%`}
          description={`${kpis.occupiedBeds}/${kpis.totalBeds} Beds Filled`}
          icon={Bed}
          color="primary"
        />
        <MetricCard
          title="Estimated Revenue"
          value={`$${kpis.simulatedRevenue.toLocaleString()}`}
          description="Based on completed visits"
          icon={DollarSign}
          color="success"
        />
        <MetricCard
          title="Emergency Alarms"
          value={kpis.activeAlerts}
          description="Requires nurse response"
          icon={ShieldAlert}
          color={kpis.activeAlerts > 0 ? 'danger' : 'primary'}
        />
        <MetricCard
          title="Total Appointments"
          value={kpis.appointmentsCount}
          description="System-wide checkups"
          icon={Calendar}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recharts Resource Inventory Levels */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <BarChart className="h-4.5 w-4.5 text-brand-600" />
              <span>Supply Inventory Capacity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72 w-full mt-4">
            {resourceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No resources found.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={resourceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3042" vertical={false} />
                  <XAxis dataKey="name" stroke="#8c909a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#8c909a" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 8, fontSize: 11 }}
                    labelClassName="font-bold text-white"
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Available" fill="#10b981" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Disease statistics summary distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <HeartPulse className="h-4.5 w-4.5 text-brand-600" />
              <span>Diagnosed Disease Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto mt-4 space-y-3.5">
            {diseaseSummary.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No clinical classifications logged.</div>
            ) : (
              diseaseSummary.map((d: any) => (
                <div key={d.disease} className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{d.disease}</span>
                  <span className="px-2.5 py-0.5 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 font-bold rounded-full">
                    {d.count} Cases
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui/CustomComponents';
import { ClipboardCheck, Sparkles, CheckCircle, HelpCircle, ShieldAlert } from 'lucide-react';

export const AdminStaff: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [coverageGaps, setCoverageGaps] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/staff/schedules');
      if (res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleAIRequest = async () => {
    setIsOptimizing(true);
    setSuccessMsg(null);
    try {
      const res = await api.post('/staff/schedules/generate');
      if (res.data.success) {
        setSuccessMsg('Constraint allocations complete. optimized schedules loaded.');
        setRecommendations(res.data.data.recommendations || []);
        setCoverageGaps(res.data.data.coverageGaps || []);
        fetchSchedules();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Clinical Roster & AI Optimizer</h2>
          <p className="text-xs text-slate-500 mt-1">AI constraint satisfaction models to generate coverage rosters for doctor/nurse shifts</p>
        </div>
        <Button
          onClick={handleAIRequest}
          isLoading={isOptimizing}
          className="flex items-center gap-1.5 font-bold shadow-lg shadow-brand-500/10 text-xs py-2 rounded-lg"
        >
          <Sparkles className="h-4.5 w-4.5 animate-pulse-subtle" />
          Trigger Roster Optimizer
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-5 w-5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roster list table */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <ClipboardCheck className="h-4.5 w-4.5 text-brand-600" />
                <span>Duty Schedules</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading schedules...</div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No shift records found. Click Roster Optimizer above.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/35 uppercase text-[9px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Clinician / Staff</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Ward Sector</th>
                        <th className="px-4 py-3">Shift Window</th>
                        <th className="px-4 py-3">Roster Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {schedules.map((sch) => (
                        <tr key={sch.id}>
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                            {sch.user?.name || 'Rostered Staff'}
                          </td>
                          <td className="px-4 py-3 font-medium">{sch.role}</td>
                          <td className="px-4 py-3">
                            <Badge variant={sch.department === 'ICU' ? 'danger' : sch.department === 'EMERGENCY' ? 'warning' : 'success'}>
                              {sch.department}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {new Date(sch.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(sch.shiftEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            {sch.autoGenerated ? (
                              <Badge variant="info">AI Solved</Badge>
                            ) : (
                              <Badge variant="neutral">Manual</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* solver suggestions logs */}
        <div className="lg:col-span-1 space-y-6">
          {recommendations.length > 0 && (
            <Card className="border-brand-500 bg-brand-50/10 dark:bg-slate-900/60 animate-fade-in">
              <CardHeader>
                <CardTitle className="text-xs">Optimization Logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {recommendations.map((rec, idx) => (
                  <p key={idx} className="text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                    • {rec}
                  </p>
                ))}

                {coverageGaps.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40">
                    <span className="text-[9px] uppercase font-bold text-clinical-rose block mb-1">
                      Coverage Gaps detected
                    </span>
                    {coverageGaps.map((gap, idx) => (
                      <div key={idx} className="flex gap-1 items-center text-[10px] text-clinical-rose font-medium">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                        <span>{gap.department}: Missing {gap.gap} staff.</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {recommendations.length === 0 && (
            <div className="h-full flex items-center justify-center p-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-900/10 min-h-[200px]">
              Trigger the solver above to calculate nurse coverage gaps and output shift rosters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

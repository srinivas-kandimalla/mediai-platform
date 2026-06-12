import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui/CustomComponents';
import { Brain, Heart, AlertTriangle } from 'lucide-react';

export const DoctorPredictions: React.FC = () => {
  const { user } = useAuthStore();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.profileId) return;

    const fetchPredictions = async () => {
      setIsLoading(true);
      try {
        // Fetch doctor's patients first
        const patientsRes = await api.get(`/doctors/${user.profileId}/patients`);
        if (patientsRes.data.success) {
          const patientList = patientsRes.data.data;
          
          // Aggregate predictions
          const list: any[] = [];
          for (const patient of patientList) {
            const predRes = await api.get(`/patients/${patient.id}/predictions`).catch(() => null);
            if (predRes && predRes.data.success) {
              // Map patient name into predictions
              const mapped = predRes.data.data.map((p: any) => ({
                ...p,
                patientName: patient.user?.name || 'Patient',
              }));
              list.push(...mapped);
            }
          }
          // Sort by date desc
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setPredictions(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPredictions();
  }, [user]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Patient Prognostics Evaluator</h2>
        <p className="text-xs text-slate-500 mt-1">Review random forest ML predictions and risk scorings for assigned patient vitals</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading prognostics logs...</div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          No patient risk evaluations recorded yet.
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((p) => {
            const percentage = Math.round(p.riskScore * 100);
            return (
              <Card key={p.id} className={p.riskScore >= 0.70 ? 'border-l-4 border-l-clinical-rose' : ''}>
                <CardContent className="p-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{p.patientName}</span>
                      <span className="text-[10px] text-slate-455">({new Date(p.createdAt).toLocaleDateString()})</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                      <Brain className="h-3.5 w-3.5 text-brand-500" />
                      <span>Likely Match: <strong>{p.predictedDisease}</strong></span>
                    </p>

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.symptoms.map((s: string) => (
                        <Badge key={s} variant="neutral" className="text-[9px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Risk Level</span>
                    <span className={`text-xl font-black ${p.riskScore >= 0.70 ? 'text-clinical-rose' : p.riskScore >= 0.40 ? 'text-clinical-amber' : 'text-emerald-500'}`}>
                      {percentage}% ({p.severityLevel})
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

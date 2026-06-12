import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui/CustomComponents';
import { FileText, Eye, AlertCircle } from 'lucide-react';

export const DoctorReports: React.FC = () => {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.profileId) return;

    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const patientsRes = await api.get(`/doctors/${user.profileId}/patients`);
        if (patientsRes.data.success) {
          const patientList = patientsRes.data.data;
          
          const list: any[] = [];
          for (const patient of patientList) {
            const reportsRes = await api.get(`/patients/${patient.id}/lab-reports`).catch(() => null);
            if (reportsRes && reportsRes.data.success) {
              const mapped = reportsRes.data.data.map((r: any) => ({
                ...r,
                patientName: patient.user?.name || 'Patient',
              }));
              list.push(...mapped);
            }
          }
          // Sort desc
          list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          setReports(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [user]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Patient Lab Reports Directory</h2>
        <p className="text-xs text-slate-500 mt-1">Review diagnostic document uploads, summaries, and chemical telemetry flags</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading lab scan records...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          No diagnostic documents uploaded by patients yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => (
            <Card key={rep.id}>
              <CardContent className="p-1 space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-brand-500" />
                      <span>{rep.reportType}</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Patient: <strong>{rep.patientName}</strong> | Uploaded: {new Date(rep.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <a
                    href={rep.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1 border border-brand-200 dark:border-brand-900/40 bg-brand-50/50 dark:bg-brand-950/20 px-2.5 py-1 rounded-lg"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Open Source Document
                  </a>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Analysis Summary</span>
                    <p className="text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                      {rep.analysisResult?.summary}
                    </p>
                  </div>

                  {rep.abnormalFlags && rep.abnormalFlags.length > 0 && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-clinical-rose tracking-wider block mb-1">
                        Abnormal Metrics Flagged
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {rep.abnormalFlags.map((flag: string) => (
                          <span
                            key={flag}
                            className="px-2 py-0.5 bg-red-100 dark:bg-red-950/45 text-clinical-rose border border-red-200 dark:border-red-900/30 text-[10px] font-bold rounded"
                          >
                            🚨 {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

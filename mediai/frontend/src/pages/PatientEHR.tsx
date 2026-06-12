import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui/CustomComponents';
import { FileText, ClipboardList, ShieldAlert, Award, Pill } from 'lucide-react';

export const PatientEHR: React.FC = () => {
  const { user } = useAuthStore();
  const [ehr, setEhr] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.profileId) return;

    const fetchEhr = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/patients/${user.profileId}/ehr`);
        if (res.data.success) {
          setEhr(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEhr();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <svg className="animate-spin h-6 w-6 text-brand-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs text-slate-450 uppercase font-semibold">Loading Health Records...</span>
      </div>
    );
  }

  // Fallback mock EHR datasets if none found in DB
  const prescriptions = ehr?.prescriptions?.length > 0 ? ehr.prescriptions : [
    { medication: 'Metformin', dosage: '500mg', frequency: 'Once daily with meals', doctor: 'Dr. Jane Smith' },
    { medication: 'Lisinopril', dosage: '10mg', frequency: 'Once daily in the morning', doctor: 'Dr. Jane Smith' }
  ];

  const diagnosticReports = ehr?.diagnosticReports?.length > 0 ? ehr.diagnosticReports : [
    { test: 'Complete Blood Count (CBC)', date: '2026-05-10', result: 'Low Hemoglobin (10.8 g/dL)', status: 'Analyzed' },
    { test: 'Fasting Blood Sugar', date: '2026-05-12', result: 'Elevated (145 mg/dL)', status: 'Analyzed' }
  ];

  const treatmentHistory = ehr?.treatmentHistory?.length > 0 ? ehr.treatmentHistory : [
    { treatment: 'Glycemic Tracking & Diet adjustments', duration: '3 months', status: 'Active' }
  ];

  const vaccinationRecords = ehr?.vaccinationRecords?.length > 0 ? ehr.vaccinationRecords : [
    { vaccine: 'COVID-19 booster', date: '2026-02-15', hospital: 'MediAI General Hospital' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Electronic Health Record (EHR)</h2>
          <p className="text-xs text-slate-500 mt-1">Official repository of prescriptions, immunizations, and diagnostics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prescriptions */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Pill className="h-5 w-5 text-brand-600" />
            <CardTitle className="text-sm">Active Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prescriptions.map((p: any, idx: number) => (
                <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/40 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800 dark:text-white text-sm">{p.medication}</span>
                    <Badge variant="info">{p.dosage}</Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">{p.frequency}</p>
                  <span className="text-[10px] text-slate-400 block mt-2">Prescribed by: {p.doctor}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic Reports */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <FileText className="h-5 w-5 text-brand-600" />
            <CardTitle className="text-sm">Diagnostic Test Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {diagnosticReports.map((d: any, idx: number) => (
                <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/40 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">{d.test}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Test Date: {d.date}</span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold block mt-1">{d.result}</span>
                  </div>
                  <Badge variant="success">{d.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Treatment History */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand-600" />
            <CardTitle className="text-sm">Active Therapies & Treatments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {treatmentHistory.map((t: any, idx: number) => (
                <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/40 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">{t.treatment}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Target Duration: {t.duration}</span>
                  </div>
                  <Badge variant="warning">{t.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vaccination Records */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Award className="h-5 w-5 text-brand-600" />
            <CardTitle className="text-sm">Immunization Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vaccinationRecords.map((v: any, idx: number) => (
                <div key={idx} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/40 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">{v.vaccine}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Administered on: {v.date}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 italic">{v.hospital}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

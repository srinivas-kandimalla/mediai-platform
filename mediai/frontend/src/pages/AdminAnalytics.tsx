import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Select } from '../components/ui/CustomComponents';
import { BarChart3, DownloadCloud } from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const [reportType, setReportType] = useState('admissions');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/analytics/reports/${reportType}`);
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const reportOptions = [
    { value: 'admissions', label: 'Admissions & Recovery Outcomes' },
    { value: 'diseases', label: 'AI Disease Prognosis Logs' },
    { value: 'resources', label: 'Inventory Utilization Levels' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Hospital Performance Reports</h2>
          <p className="text-xs text-slate-500 mt-1">Audit historic patient recovery timelines, ICU allocations, and resource utilization metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Selector form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <BarChart3 className="h-4.5 w-4.5 text-brand-600" />
                <span>Configure Query</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                label="Choose Report Category"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                options={reportOptions}
              />
            </CardContent>
          </Card>
        </div>

        {/* Query result table */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Audit Data Stream</CardTitle>
            </CardHeader>
            <CardContent className="mt-4">
              {isLoading ? (
                <div className="text-center py-12 text-xs text-slate-400">Loading records stream...</div>
              ) : reportData.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">No records found matching criteria.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/35 uppercase text-[9px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                      {reportType === 'admissions' ? (
                        <tr>
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3">Recovery Likelihood</th>
                          <th className="px-4 py-3">ICU Required</th>
                          <th className="px-4 py-3">Est. Stay Duration</th>
                          <th className="px-4 py-3">Mortality Risk</th>
                        </tr>
                      ) : reportType === 'diseases' ? (
                        <tr>
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3">Symptoms</th>
                          <th className="px-4 py-3">Diagnosed Match</th>
                          <th className="px-4 py-3">Risk Rating</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="px-4 py-3">Resource Asset</th>
                          <th className="px-4 py-3">Capacity Limit</th>
                          <th className="px-4 py-3">Stock Available</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {reportData.map((item, idx) => (
                        <tr key={idx}>
                          {reportType === 'admissions' ? (
                            <>
                              <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                                {item.patient?.user?.name || 'Patient'}
                              </td>
                              <td className="px-4 py-3 font-semibold text-emerald-500">
                                {Math.round(item.recoveryProbability * 100)}%
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {item.icuRequired ? '🚨 Yes' : 'No'}
                              </td>
                              <td className="px-4 py-3 font-medium">{item.expectedStayDays} Days</td>
                              <td className="px-4 py-3 font-semibold text-clinical-rose">
                                {Math.round(item.mortalityRisk * 100)}%
                              </td>
                            </>
                          ) : reportType === 'diseases' ? (
                            <>
                              <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                                {item.patient?.user?.name || 'Patient'}
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {Array.isArray(item.symptoms) ? item.symptoms.join(', ') : ''}
                              </td>
                              <td className="px-4 py-3 font-bold">{item.predictedDisease}</td>
                              <td className="px-4 py-3 font-semibold text-clinical-rose">
                                {Math.round(item.riskScore * 100)}%
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                                {item.resourceType}
                              </td>
                              <td className="px-4 py-3 font-medium">{item.totalUnits} Units</td>
                              <td className="px-4 py-3 font-medium">{item.availableUnits} Units</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

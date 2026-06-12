import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Input } from './ui/CustomComponents';
import { UploadCloud, FileSpreadsheet, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../services/api';

interface LabReportUploaderProps {
  patientId: string;
  onUploadSuccess?: () => void;
}

export const LabReportUploader: React.FC<LabReportUploaderProps> = ({ patientId, onUploadSuccess }) => {
  const [reportType, setReportType] = useState('Blood Panel');
  const [fileUrl, setFileUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const reportTypeOptions = [
    { value: 'Blood Panel', label: 'Blood Panel (CBC)' },
    { value: 'ECG Report', label: 'Electrocardiogram (ECG)' },
    { value: 'MRI Scan', label: 'Magnetic Resonance Imaging (MRI)' },
    { value: 'X-Ray Report', label: 'Radiograph (X-Ray)' },
  ];

  const handleMockUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      // Direct call to upload endpoint in patientController
      const response = await api.post(`/patients/${patientId}/lab-reports`, {
        reportType,
        fileUrl: fileUrl || undefined, // Will fallback to default sample in backend if empty
      });

      if (response.data.success) {
        setResult(response.data.data);
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload and analyze report');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-brand-600" />
          <span>Upload Lab Report / Scan</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleMockUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Select Scan/Report Type"
              options={reportTypeOptions}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            />
            <Input
              label="Cloudinary File URL (Optional)"
              placeholder="Leave blank to use diagnostic sample"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
          </div>

          {/* Simple Drop zone indicator */}
          <div className="border-2 border-dashed border-slate-350 dark:border-slate-800 rounded-xl p-6 text-center bg-slate-50/50 dark:bg-slate-800/10 flex flex-col items-center justify-center gap-2.5">
            <FileSpreadsheet className="h-8 w-8 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Drag PDF scans or image reports here</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Max size: 10MB (PDF, PNG, JPG)</p>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isUploading}
            className="w-full text-xs py-2 rounded-lg font-bold"
          >
            Submit & Run AI OCR Analysis
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-clinical-rose font-medium">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/20 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
              <CheckCircle2 className="h-4.5 w-4.5" />
              <span>OCR extraction & NLP parsing complete</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Report Summary</span>
                <p className="text-slate-800 dark:text-slate-300 font-medium mt-1">
                  {result.analysisResult?.summary}
                </p>
              </div>

              {result.abnormalFlags && result.abnormalFlags.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-clinical-rose tracking-wider block">Abnormal Value Flags</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {result.abnormalFlags.map((flag: string) => (
                      <span
                        key={flag}
                        className="px-2.5 py-1 rounded bg-red-100 dark:bg-red-950/45 text-clinical-rose border border-red-200 dark:border-red-900/40 text-[10px] font-bold"
                      >
                        🚨 {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

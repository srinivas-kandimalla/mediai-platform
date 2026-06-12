import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Input, Select, Button } from '../components/ui/CustomComponents';
import { Stethoscope, CheckCircle2, ListPlus } from 'lucide-react';

export const DoctorRecommendations: React.FC = () => {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [predictedDisease, setPredictedDisease] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [patientHistory, setPatientHistory] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<any>(null);

  useEffect(() => {
    if (!user?.profileId) return;
    const fetchPatients = async () => {
      try {
        const res = await api.get(`/doctors/${user.profileId}/patients`);
        if (res.data.success) {
          setPatients(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedPatientId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPatients();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !predictedDisease) return;

    setIsLoading(true);
    setSuccessMsg(null);
    setRecommendationResult(null);

    try {
      const symptomsList = symptoms.split(',').map((s) => s.trim()).filter(Boolean);

      // Call API proxy which contacts FastAPI optimization engine
      const res = await api.post('/ai/recommend-treatment', {
        patientId: selectedPatientId,
        doctorId: user?.profileId,
        symptoms: symptomsList,
        predictedDisease,
        patientHistory,
      });

      if (res.data.success) {
        setSuccessMsg('Treatment plan registered and dispatched to patient profile.');
        setRecommendationResult(res.data.data);
        setPredictedDisease('');
        setSymptoms('');
        setPatientHistory('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Clinical Treatment Planner</h2>
        <p className="text-xs text-slate-500 mt-1">Prescribe clinical plans, medication guidance, and diagnostic tests using hybrid expert engines</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form container */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-5.5 w-5.5 text-brand-600" />
                <span>Compile New Treatment Plan</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                  label="Select Target Patient"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  options={patients.map((p) => ({
                    value: p.id,
                    label: `${p.user?.name || 'Patient'} (Age: ${p.age})`,
                  }))}
                />

                <Input
                  label="Diagnosed Disease Match"
                  placeholder="e.g. Diabetes, Pneumonia, Cardiovascular Disease"
                  value={predictedDisease}
                  onChange={(e) => setPredictedDisease(e.target.value)}
                  required
                />

                <Input
                  label="Presenting Symptoms (comma-separated)"
                  placeholder="fever, cough, chest_pain"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />

                <Input
                  label="Patient Medical History Overview"
                  placeholder="e.g. Hypertension history, family diabetes history"
                  value={patientHistory}
                  onChange={(e) => setPatientHistory(e.target.value)}
                />

                <Button type="submit" isLoading={isLoading} className="w-full font-bold">
                  <ListPlus className="h-4 w-4" />
                  Evaluate & Save Recommendations
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Display results summary */}
        <div className="lg:col-span-1">
          {recommendationResult ? (
            <Card className="border-brand-500 bg-brand-50/10 dark:bg-slate-900/60 animate-fade-in">
              <CardHeader>
                <CardTitle className="text-sm">Evaluated Plan Outputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Recommended Plan</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-350">
                    {Array.isArray(recommendationResult.recommendedTreatment)
                      ? recommendationResult.recommendedTreatment.map((t: string) => <li key={t}>{t}</li>)
                      : <li>{JSON.stringify(recommendationResult.recommendedTreatment)}</li>}
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Suggested Diagnostics</span>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(recommendationResult.suggestedTests)
                      ? recommendationResult.suggestedTests.map((t: string) => (
                          <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-semibold border border-slate-200 dark:border-slate-700">
                            {t}
                          </span>
                        ))
                      : null}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Medication Guidance</span>
                  <p className="text-slate-600 dark:text-slate-400 italic">
                    {recommendationResult.medicationGuidance?.medications?.join(', ') || 'No medications suggested.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-900/10">
              Submit the planner form to view expert suggestions here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

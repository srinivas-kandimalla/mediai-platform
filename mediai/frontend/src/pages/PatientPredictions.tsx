import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '../components/ui/CustomComponents';
import { PredictionResultCard } from '../components/PredictionResultCard';
import { Brain, Sparkles, CheckSquare, Square, History } from 'lucide-react';

const SYMPTOMS_LIST = [
  { value: 'fever', label: 'Fever / Chills' },
  { value: 'cough', label: 'Dry or Wet Cough' },
  { value: 'fatigue', label: 'Chronic Fatigue' },
  { value: 'shortness_of_breath', label: 'Shortness of Breath' },
  { value: 'chest_pain', label: 'Chest Pressure / Pain' },
  { value: 'headache', label: 'Severe Headache' },
  { value: 'nausea', label: 'Nausea / Vomiting' },
  { value: 'joint_pain', label: 'Muscle or Joint Pain' },
  { value: 'dizziness', label: 'Dizziness' },
  { value: 'sore_throat', label: 'Sore Throat' },
];

export const PatientPredictions: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [systolicBP, setSystolicBP] = useState('120');
  const [sugar, setSugar] = useState('90');
  const [cholesterol, setCholesterol] = useState('180');
  const [bmi, setBmi] = useState('22.5');

  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user?.profileId) return;
    setHistoryLoading(true);
    try {
      const res = await api.get(`/patients/${user.profileId}/predictions`);
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) return;

    setIsLoading(true);
    setPredictionResult(null);
    try {
      // Find patient profile age
      const profileRes = await api.get(`/patients/${user?.profileId}`);
      const age = profileRes.data.data?.age || 35;

      const res = await api.post('/ai/predict-disease', {
        patientId: user?.profileId,
        age,
        symptoms: selectedSymptoms,
        bloodPressure: systolicBP,
        sugarLevel: parseFloat(sugar),
        cholesterol: parseFloat(cholesterol),
        bmi: parseFloat(bmi),
      });

      if (res.data.success) {
        setPredictionResult(res.data.data);
        fetchHistory(); // Refresh history
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">AI Health Risk Prognostics</h2>
        <p className="text-xs text-slate-500 mt-1">Screen patient vitals using Random Forest classifier intelligence</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Symptom selection forms */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-5.5 w-5.5 text-brand-600" />
                <span>Submit Clinical Symptoms Checklist</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePredict} className="space-y-6">
                {/* Checklist grid */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Select All Active Symptoms
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SYMPTOMS_LIST.map((sym) => {
                      const isSelected = selectedSymptoms.includes(sym.value);
                      return (
                        <button
                          key={sym.value}
                          type="button"
                          onClick={() => toggleSymptom(sym.value)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50/15 text-brand-600 dark:text-brand-400'
                              : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 shrink-0 text-brand-500" />
                          ) : (
                            <Square className="h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <span>{sym.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vitals entries */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800/50 pt-5">
                  <Input
                    label="Systolic BP (mmHg)"
                    placeholder="120"
                    value={systolicBP}
                    onChange={(e) => setSystolicBP(e.target.value)}
                  />
                  <Input
                    label="Fasting Glucose (mg/dL)"
                    placeholder="90"
                    value={sugar}
                    onChange={(e) => setSugar(e.target.value)}
                  />
                  <Input
                    label="Cholesterol (mg/dL)"
                    placeholder="180"
                    value={cholesterol}
                    onChange={(e) => setCholesterol(e.target.value)}
                  />
                  <Input
                    label="BMI Indicator"
                    placeholder="22.5"
                    value={bmi}
                    onChange={(e) => setBmi(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={selectedSymptoms.length === 0}
                  isLoading={isLoading}
                  className="w-full text-xs font-bold py-2.5 rounded-xl shadow-lg"
                >
                  <Sparkles className="h-4 w-4" />
                  Evaluate Health Metrics
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Render result */}
          {predictionResult && (
            <PredictionResultCard
              disease={predictionResult.predictedDisease}
              riskScore={predictionResult.riskScore}
              severity={predictionResult.severityLevel}
              symptoms={predictionResult.symptoms}
              date={predictionResult.createdAt}
            />
          )}
        </div>

        {/* Prediction log history */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-5 w-5 text-brand-600" />
                <span>Historic Risk Screens</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-6 text-xs text-slate-400">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No predictions recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 text-xs"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{h.predictedDisease}</span>
                        <span className={`font-extrabold ${h.riskScore >= 0.70 ? 'text-clinical-rose' : h.riskScore >= 0.40 ? 'text-clinical-amber' : 'text-emerald-500'}`}>
                          {Math.round(h.riskScore * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-455">
                        <span>Severity: {h.severityLevel}</span>
                        <span>{new Date(h.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

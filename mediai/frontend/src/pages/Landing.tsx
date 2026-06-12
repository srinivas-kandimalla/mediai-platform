import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Brain, Bed, ShieldAlert, ChevronRight, Activity, Calendar } from 'lucide-react';
import { Button } from '../components/ui/CustomComponents';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1220] via-[#0f172a] to-[#1e1b4b] text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Navigation Header */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-slate-800/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-2 rounded-xl text-white shadow-lg shadow-brand-500/20">
            <HeartPulse className="h-6 w-6 animate-pulse-subtle" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-brand-500 to-indigo-300 bg-clip-text text-transparent">
            MediAI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/login')} className="text-slate-350 hover:text-white">
            Sign In
          </Button>
          <Button onClick={() => navigate('/register')} className="shadow-lg shadow-brand-650/20">
            Patient Signup
          </Button>
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
        <div className="space-y-6">
          <Badge className="bg-brand-950/60 text-brand-400 border-brand-800/40 text-[10px] tracking-wider uppercase font-semibold px-3 py-1">
            ✨ Hospital Operations Intelligence
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AI-Powered Healthcare & Resource Forecasting
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl">
            MediAI helps medical institutions predict patient clinical outcomes, analyze lab report telemetry using OCR and NLP, manage shift constraints, and dispatch emergency alerts.
          </p>

          <div className="flex items-center gap-4 pt-4 flex-wrap">
            <Button onClick={() => navigate('/login')} className="px-6 py-3 text-base font-bold shadow-xl shadow-brand-500/20">
              Launch Console
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/register/doctor')} className="px-6 py-3 text-base font-bold">
              Join as Doctor
            </Button>
          </div>
        </div>

        {/* Visual Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/30 flex flex-col gap-4 hover:-translate-y-1 transition-transform">
            <div className="h-10 w-10 bg-indigo-500/10 text-brand-400 rounded-xl flex items-center justify-center">
              <Brain className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">ML Vitals Prognosis</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Random Forest telemetry to predict patient stay durations, readmission flags, and disease diagnoses.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/30 flex flex-col gap-4 hover:-translate-y-1 transition-transform">
            <div className="h-10 w-10 bg-emerald-500/10 text-emerald-450 rounded-xl flex items-center justify-center">
              <Activity className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Lab Reports OCR & NLP</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Scan hematology reports and PDFs to isolate chemical abnormalities and trigger warning alerts.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/30 flex flex-col gap-4 hover:-translate-y-1 transition-transform">
            <div className="h-10 w-10 bg-rose-500/10 text-clinical-rose rounded-xl flex items-center justify-center">
              <ShieldAlert className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Emergency Alarms</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Automated notifications sent to doctors via WebSocket and SMS for critical oxygen or pressure vitals.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/30 flex flex-col gap-4 hover:-translate-y-1 transition-transform">
            <div className="h-10 w-10 bg-amber-500/10 text-clinical-amber rounded-xl flex items-center justify-center">
              <Bed className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Bed & Staff Optimizer</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Roster solvers and ARIMA-style forecasting to allocate ICU wards and balance daily rosters.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/40 py-6 text-center text-[10px] text-slate-500">
        &copy; 2026 MediAI Platform. Hospital Operational Intelligence System. All rights reserved.
      </footer>
    </div>
  );
};

// Internal small helper to avoid import loops
const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ children, className = '', ...props }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`} {...props}>
    {children}
  </span>
);

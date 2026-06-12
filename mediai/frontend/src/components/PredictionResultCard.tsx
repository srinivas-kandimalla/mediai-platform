import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from './ui/CustomComponents';
import { Brain, ShieldAlert, Sparkles } from 'lucide-react';

interface PredictionResultCardProps {
  disease: string;
  riskScore: number;
  severity: string;
  symptoms: string[];
  date: string;
}

export const PredictionResultCard: React.FC<PredictionResultCardProps> = ({
  disease,
  riskScore,
  severity,
  symptoms,
  date,
}) => {
  const percentage = Math.round(riskScore * 100);

  // Determine styling based on severity level
  const severityColors = {
    LOW: 'success',
    MODERATE: 'warning',
    HIGH: 'danger',
    CRITICAL: 'danger',
  } as const;

  const severityBadgeVariant = severityColors[severity as keyof typeof severityColors] || 'neutral';

  // Calculate SVG stroke offset for the circular gauge (circumference = 2 * PI * r)
  // Let r = 40, circumference = 251.2
  // We draw a semi-circle gauge (half circle + start offset) or simple progress ring
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (riskScore * circumference);

  const getGaugeColor = () => {
    if (riskScore >= 0.70) return '#f43f5e'; // red-500
    if (riskScore >= 0.40) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 h-24 w-24 bg-brand-500/5 dark:bg-brand-500/10 rounded-bl-full flex items-center justify-center pointer-events-none">
        <Brain className="h-6 w-6 text-brand-600/30 dark:text-brand-400/30" />
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <CardTitle className="text-base">AI Disease Risk Estimate</CardTitle>
        </div>
        <p className="text-[10px] text-slate-450 dark:text-slate-550">
          Generated: {new Date(date).toLocaleString()}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col md:flex-row items-center gap-6 mt-2">
        {/* Animated SVG circular gauge */}
        <div className="relative h-28 w-28 shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-full border border-slate-100 dark:border-slate-800/20">
          <svg className="h-24 w-24 transform -rotate-90">
            {/* Background track circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated risk indicators stroke */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke={getGaugeColor()}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out gauge-stroke"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{percentage}%</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Risk Score</span>
          </div>
        </div>

        {/* Diagnosis & symptoms list */}
        <div className="flex-1 space-y-3 w-full">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Likely Disease Match</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">{disease}</h4>
          </div>

          <div className="flex gap-4 items-center flex-wrap">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">Severity Class</span>
              <Badge variant={severityBadgeVariant} className="mt-1 font-semibold uppercase">
                {severity}
              </Badge>
            </div>
            {riskScore >= 0.70 && (
              <div className="flex items-center gap-1 text-clinical-rose text-[11px] font-semibold bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-lg border border-red-100/50 dark:border-red-900/20">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Urgent Clinical Review Required</span>
              </div>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">Reported Symptoms</span>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {symptoms.map((s) => (
                <Badge key={s} variant="neutral" className="text-[10px] bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

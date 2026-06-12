import React from 'react';
import { Card, CardContent, Badge } from './ui/CustomComponents';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface ResourceGaugeProps {
  id: string;
  resourceType: 'VENTILATOR' | 'OXYGEN' | 'EQUIPMENT';
  totalUnits: number;
  availableUnits: number;
}

export const ResourceGauge: React.FC<ResourceGaugeProps> = ({
  resourceType,
  totalUnits,
  availableUnits,
}) => {
  const percentage = totalUnits > 0 ? Math.round((availableUnits / totalUnits) * 100) : 0;
  
  const getProgressColor = () => {
    if (percentage <= 25) return 'bg-clinical-rose'; // Critical stock
    if (percentage <= 50) return 'bg-clinical-amber'; // Low stock
    return 'bg-emerald-500'; // High stock
  };

  const isLowStock = percentage <= 30;

  return (
    <Card>
      <CardContent className="p-1 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{resourceType}</h4>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold block uppercase tracking-wide mt-0.5">
              Current Supply Status
            </span>
          </div>

          <Badge variant={isLowStock ? 'danger' : 'success'}>
            {percentage}% Left
          </Badge>
        </div>

        {/* Visual Progress bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${getProgressColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Available: {availableUnits} Units</span>
            <span>Capacity: {totalUnits} Units</span>
          </div>
        </div>

        {/* Advisory tag */}
        <div className={`p-2.5 rounded-lg flex items-center gap-2 border text-[11px] ${
          isLowStock
            ? 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/20 text-clinical-rose'
            : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-400'
        }`}>
          {isLowStock ? (
            <>
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Low supply levels. Emergency restock advised.</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Sufficient inventory levels for standard patient care.</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

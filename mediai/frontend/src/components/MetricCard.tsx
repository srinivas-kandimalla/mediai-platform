import React from 'react';
import { Card, CardContent } from './ui/CustomComponents';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'primary',
}) => {
  const colorClasses = {
    primary: 'bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
    danger: 'bg-rose-50 text-clinical-rose dark:bg-rose-950/30 dark:text-clinical-rose',
  };

  return (
    <Card className="hover:scale-[1.01] transition-transform duration-200">
      <CardContent className="flex items-center justify-between p-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-slate-800 dark:text-white mt-2 tracking-tight">{value}</h4>
          
          {(trend || description) && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {trend && (
                <span className={`text-xs font-semibold ${trend.isPositive ? 'text-emerald-500' : 'text-clinical-rose'}`}>
                  {trend.value}
                </span>
              )}
              {description && (
                <span className="text-xs text-slate-450 dark:text-slate-550 truncate">{description}</span>
              )}
            </div>
          )}
        </div>

        <div className={`p-3.5 rounded-xl shrink-0 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
};

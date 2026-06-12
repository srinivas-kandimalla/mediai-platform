import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from './ui/CustomComponents';
import { Calendar, Award, MapPin } from 'lucide-react';

interface DoctorCardProps {
  id: string;
  name: string;
  specialization: string;
  department: string;
  experience: number;
  qualification: string;
  availableSlots: string[];
  onBookClick?: (id: string, name: string) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  id,
  name,
  specialization,
  department,
  experience,
  qualification,
  availableSlots,
  onBookClick,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/35 h-12 w-12 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg border border-emerald-100 dark:border-emerald-900/40">
            {name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <CardTitle className="text-base">Dr. {name}</CardTitle>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-0.5">{specialization}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Credentials Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-slate-450 shrink-0" />
            <span>{qualification}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-450 shrink-0" />
            <span>{department}</span>
          </div>
          <div className="col-span-2 text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/45 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800/30">
            💼 <strong>{experience} years</strong> clinical experience
          </div>
        </div>

        {/* Action Button */}
        {onBookClick && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
              {availableSlots.length} Slots Available
            </span>
            <Button
              variant="outline"
              onClick={() => onBookClick(id, name)}
              className="text-xs py-1.5 px-3 rounded-lg"
            >
              <Calendar className="h-3.5 w-3.5" />
              Book Consult
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from './ui/CustomComponents';
import { User, Activity, AlertTriangle } from 'lucide-react';

interface PatientCardProps {
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  weight: number;
  height: number;
  allergies: string;
  medicalHistory: string;
  createdAt: string;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  name,
  age,
  gender,
  bloodGroup,
  weight,
  height,
  allergies,
  medicalHistory,
  createdAt,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3.5 pb-2">
        <div className="bg-brand-100 dark:bg-brand-950/40 p-2.5 rounded-full text-brand-600 dark:text-brand-400">
          <User className="h-5.5 w-5.5" />
        </div>
        <div>
          <CardTitle className="text-base">{name}</CardTitle>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase font-semibold mt-0.5">
            Registered: {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Core Demographics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div>
            <span className="text-slate-450 dark:text-slate-500 block uppercase font-medium text-[10px]">Age / Gender</span>
            <span className="font-semibold text-slate-700 dark:text-slate-350">{age} yrs / {gender}</span>
          </div>
          <div>
            <span className="text-slate-450 dark:text-slate-500 block uppercase font-medium text-[10px]">Blood Group</span>
            <span className="font-semibold text-slate-700 dark:text-slate-350">{bloodGroup}</span>
          </div>
          <div className="mt-1">
            <span className="text-slate-450 dark:text-slate-500 block uppercase font-medium text-[10px]">Weight (BMI)</span>
            <span className="font-semibold text-slate-700 dark:text-slate-350">{weight} kg</span>
          </div>
          <div className="mt-1">
            <span className="text-slate-450 dark:text-slate-500 block uppercase font-medium text-[10px]">Height</span>
            <span className="font-semibold text-slate-700 dark:text-slate-350">{height} cm</span>
          </div>
        </div>

        {/* Clinical alerts & History */}
        <div className="space-y-2 text-xs">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="h-4 w-4 text-clinical-amber shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400">Allergies</span>
              <p className="text-slate-700 dark:text-slate-350 font-medium mt-0.5">{allergies}</p>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <Activity className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400">Medical History</span>
              <p className="text-slate-700 dark:text-slate-350 font-medium mt-0.5">{medicalHistory}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { Bed } from '../types';
import { Badge } from './ui/CustomComponents';
import { Check, X, ShieldAlert } from 'lucide-react';

interface BedGridProps {
  beds: Bed[];
  onReleaseClick?: (bedId: string) => void;
  onAssignClick?: (bed: Bed) => void;
  isAdmin?: boolean;
}

export const BedGrid: React.FC<BedGridProps> = ({
  beds,
  onReleaseClick,
  onAssignClick,
  isAdmin = false,
}) => {
  // Group beds by ward type
  const wards: Record<string, Bed[]> = {
    GENERAL: [],
    ICU: [],
    EMERGENCY: [],
    PRIVATE: [],
  };

  beds.forEach((bed) => {
    if (wards[bed.wardType]) {
      wards[bed.wardType].push(bed);
    }
  });

  const getWardColor = (ward: string) => {
    switch (ward) {
      case 'ICU': return 'border-red-500 bg-red-500/5 text-red-500';
      case 'EMERGENCY': return 'border-amber-500 bg-amber-500/5 text-amber-500';
      case 'PRIVATE': return 'border-indigo-500 bg-indigo-500/5 text-indigo-500';
      default: return 'border-emerald-500 bg-emerald-500/5 text-emerald-500';
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(wards).map(([wardName, wardBeds]) => (
        <div key={wardName} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-md uppercase tracking-wider ${getWardColor(wardName)}`}>
              {wardName} WARD ({wardBeds.filter((b) => !b.isOccupied).length} Open)
            </span>
          </div>

          {wardBeds.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-800/10 rounded-xl border border-slate-100 dark:border-slate-800">
              No beds assigned to this ward.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {wardBeds.map((bed) => (
                <div
                  key={bed.id}
                  className={`border rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-sm transition-all duration-150 ${
                    bed.isOccupied
                      ? 'border-red-200 bg-red-50/20 dark:border-red-950/40 dark:bg-red-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                        Bed Ref
                      </span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate mt-0.5" title={bed.id}>
                        #{bed.id.slice(0, 6)}
                      </p>
                    </div>
                    {bed.isOccupied ? (
                      <span className="p-1 rounded-full bg-red-100 dark:bg-red-950/60 text-clinical-rose text-xs" title="Occupied">
                        <X className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 text-xs" title="Vacant">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {bed.isOccupied && bed.patient?.user && (
                      <div className="text-[10px] text-slate-600 dark:text-slate-400">
                        <span className="block text-slate-400 font-medium">Patient</span>
                        <p className="font-semibold truncate">{bed.patient.user.name}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {bed.isOccupied ? (
                        <>
                          {isAdmin && onReleaseClick && (
                            <button
                              onClick={() => onReleaseClick(bed.id)}
                              className="text-[9px] font-bold text-clinical-rose hover:text-red-700 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded transition-all"
                            >
                              Release
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {isAdmin && onAssignClick && (
                            <button
                              onClick={() => onAssignClick(bed)}
                              className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded transition-all"
                            >
                              Assign
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

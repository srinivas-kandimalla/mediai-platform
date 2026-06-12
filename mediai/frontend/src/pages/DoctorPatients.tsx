import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui/CustomComponents';
import { PatientCard } from '../components/PatientCard';
import { Users, Search } from 'lucide-react';

export const DoctorPatients: React.FC = () => {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.profileId) return;

    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/doctors/${user.profileId}/patients`);
        if (res.data.success) {
          setPatients(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, [user]);

  const filteredPatients = patients.filter((p) =>
    p.user?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Assigned Patient Records</h2>
          <p className="text-xs text-slate-500 mt-1">Review demographics, background medical profiles, and history summaries</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-5 w-5 text-brand-600" />
            <span>Search Patient Roster</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Type patient name to filter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading patients roster...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          No patients matched the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((pat) => (
            <PatientCard
              key={pat.id}
              name={pat.user?.name || 'Patient'}
              age={pat.age}
              gender={pat.gender}
              bloodGroup={pat.bloodGroup}
              weight={pat.weight}
              height={pat.height}
              allergies={pat.allergies}
              medicalHistory={pat.medicalHistory}
              createdAt={pat.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
};

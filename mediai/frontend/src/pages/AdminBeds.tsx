import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BedGrid } from '../components/BedGrid';
import { Card, CardHeader, CardTitle, CardContent, Input, Select, Button } from '../components/ui/CustomComponents';
import { Bed, Patient } from '../types';
import { BedDouble, CheckCircle2, UserPlus } from 'lucide-react';

export const AdminBeds: React.FC = () => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Assign bed state
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [expectedStay, setExpectedStay] = useState('4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBeds = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/beds/availability');
      if (res.data.success) {
        setBeds(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      // Find all doctors first to retrieve assigned patient arrays or fetch globally
      const res = await api.get('/doctors'); // Or any list endpoints
      // Fetch patients from endpoint (we can also fallback list)
      const patRes = await api.get('/patients/1').catch(() => null); // Let's use doctors listing or search
      
      // For testing, let's pre-populate patient listings
      setPatients([
        { id: 'pat-1', userId: 'usr-1', age: 35, gender: 'Male', bloodGroup: 'O+', weight: 72, height: 178, allergies: 'None', medicalHistory: 'None', familyHistory: 'None', insuranceDetails: 'None', createdAt: '', user: { id: 'usr-1', name: 'John Doe', email: 'john@example.com', role: 'PATIENT', createdAt: '', isActive: true } },
        { id: 'pat-2', userId: 'usr-2', age: 48, gender: 'Female', bloodGroup: 'A-', weight: 64, height: 165, allergies: 'Penicillin', medicalHistory: 'Hypertension', familyHistory: 'None', insuranceDetails: 'None', createdAt: '', user: { id: 'usr-2', name: 'Jane Miller', email: 'jane@example.com', role: 'PATIENT', createdAt: '', isActive: true } },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBeds();
    fetchPatients();
  }, []);

  const handleRelease = async (bedId: string) => {
    try {
      const res = await api.put(`/beds/${bedId}/release`);
      if (res.data.success) {
        setSuccessMsg(`Bed ${bedId.slice(0, 6)} has been released successfully.`);
        fetchBeds();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !selectedPatientId) return;

    setIsSubmitting(true);
    setSuccessMsg(null);
    try {
      const res = await api.post('/beds/assign', {
        bedId: selectedBed.id,
        patientId: selectedPatientId,
        expectedStayDays: parseInt(expectedStay),
      });

      if (res.data.success) {
        setSuccessMsg(`Bed allocated to patient successfully.`);
        setSelectedBed(null);
        setSelectedPatientId('');
        fetchBeds();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Bed Operations Console</h2>
          <p className="text-xs text-slate-500 mt-1">Allocate and release hospital beds across clinical wards</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main grid layout */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading beds layout...</div>
          ) : (
            <BedGrid
              beds={beds}
              isAdmin={true}
              onReleaseClick={handleRelease}
              onAssignClick={(bed) => setSelectedBed(bed)}
            />
          )}
        </div>

        {/* Allocations form panel */}
        <div className="lg:col-span-1">
          {selectedBed ? (
            <Card className="border-brand-500 bg-brand-50/10 dark:bg-slate-900/60 animate-fade-in">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <UserPlus className="h-4.5 w-4.5 text-brand-600" />
                  <span>Allocate Bed #{selectedBed.id.slice(0, 6)}</span>
                </CardTitle>
                <p className="text-[10px] text-slate-400 uppercase mt-0.5">Ward: {selectedBed.wardType}</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAssignSubmit} className="space-y-4">
                  <Select
                    label="Choose Patient"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    options={[
                      { value: '', label: '-- Choose Patient --' },
                      ...patients.map((p) => ({
                        value: p.id,
                        label: p.user?.name || 'Patient',
                      })),
                    ]}
                    required
                  />

                  <Input
                    label="Expected Stay (Days)"
                    placeholder="4"
                    value={expectedStay}
                    onChange={(e) => setExpectedStay(e.target.value)}
                    required
                  />

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setSelectedBed(null)} className="w-1/3 py-2 text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting} className="w-2/3 py-2 text-xs font-bold">
                      Confirm Allocation
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-900/10 min-h-[200px]">
              Select a vacant bed grid square to allocate a patient profile here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

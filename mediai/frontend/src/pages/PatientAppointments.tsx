import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Input, Select, Button } from '../components/ui/CustomComponents';
import { AppointmentCalendar } from '../components/AppointmentCalendar';
import { DoctorCard } from '../components/DoctorCard';
import { Calendar, Search, Stethoscope, CheckCircle2 } from 'lucide-react';

export const PatientAppointments: React.FC = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');

  // Booking details modal/form state
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAppointments = async () => {
    if (!user?.profileId) return;
    try {
      const res = await api.get(`/patients/${user.profileId}/appointments`);
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors', {
        params: { search: search || undefined, department: dept || undefined },
      });
      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  useEffect(() => {
    fetchDoctors();
  }, [search, dept]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !selectedSlot) return;

    setBookingLoading(true);
    setSuccessMsg(null);
    try {
      const res = await api.post('/appointments', {
        patientId: user?.profileId,
        doctorId: selectedDoc.id,
        scheduledAt: selectedSlot,
        notes,
      });

      if (res.data.success) {
        setSuccessMsg('Booking requested successfully. Specialist has been notified.');
        setNotes('');
        setSelectedDoc(null);
        setSelectedSlot('');
        fetchAppointments(); // Reload list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  const deptOptions = [
    { value: '', label: 'All Departments' },
    { value: 'General Medicine', label: 'General Medicine' },
    { value: 'ICU', label: 'ICU / Intensive Care' },
    { value: 'Emergency Wards', label: 'Emergency Medicine' },
    { value: 'Cardiology', label: 'Cardiology' },
    { value: 'Pulmonology', label: 'Pulmonology' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Consultations Scheduler</h2>
        <p className="text-xs text-slate-500 mt-1">Book virtual or physical consults with hospital specialists</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings calendar */}
        <div className="lg:col-span-1">
          <AppointmentCalendar
            appointments={appointments}
            role="PATIENT"
            showActions={false}
          />
        </div>

        {/* Doctor search & booking panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-5 w-5 text-brand-600" />
                <span>Search Specialists</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Search doctor by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Select
                  options={deptOptions}
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Booking Request details panel */}
          {selectedDoc && (
            <Card className="border-brand-500 bg-brand-50/10 dark:bg-slate-900/60 animate-fade-in">
              <CardHeader>
                <CardTitle className="text-sm">Request Consult with Dr. {selectedDoc.user?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBookSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Select Available Slot</label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs w-full focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="">-- Choose open time slot --</option>
                      {/* Doctor avail slots JSON array. If empty, generate dummy slots for testing */}
                      {(selectedDoc.availableSlots && selectedDoc.availableSlots.length > 0
                        ? selectedDoc.availableSlots
                        : [
                            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                            new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                          ]
                      ).map((slotStr: string) => (
                        <option key={slotStr} value={slotStr}>
                          {new Date(slotStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Reason for Consultation / symptoms"
                    placeholder="Describe symptoms briefly..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setSelectedDoc(null)} className="w-1/3 py-2 text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={bookingLoading} className="w-2/3 py-2 text-xs font-bold">
                      Confirm Appointment Request
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Doctors profiles matching results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                id={doc.id}
                name={doc.user?.name || 'Specialist'}
                specialization={doc.specialization}
                department={doc.department}
                experience={doc.experience}
                qualification={doc.qualification}
                availableSlots={doc.availableSlots}
                onBookClick={() => setSelectedDoc(doc)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { AppointmentCalendar } from '../components/AppointmentCalendar';

export const DoctorAppointments: React.FC = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user?.profileId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/doctors/${user.profileId}/appointments`);
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleStatusChange = async (id: string, newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    try {
      const res = await api.put(`/appointments/${id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchAppointments(); // Reload
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Appointments Roster</h2>
        <p className="text-xs text-slate-500 mt-1">Approve, decline, or complete bookings scheduled by patients</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading appointments roster...</div>
      ) : (
        <div className="max-w-4xl">
          <AppointmentCalendar
            appointments={appointments}
            role="DOCTOR"
            showActions={true}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}
    </div>
  );
};

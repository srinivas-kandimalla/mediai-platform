import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, Input, Select, Button } from '../components/ui/CustomComponents';
import { User, Save, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

export const PatientProfile: React.FC = () => {
  const { user } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (!user?.profileId) return;

    const loadProfile = async () => {
      try {
        const res = await api.get(`/patients/${user.profileId}`);
        if (res.data.success) {
          const profile = res.data.data;
          setValue('age', String(profile.age));
          setValue('gender', profile.gender);
          setValue('bloodGroup', profile.bloodGroup);
          setValue('weight', String(profile.weight));
          setValue('height', String(profile.height));
          setValue('allergies', profile.allergies);
          setValue('medicalHistory', profile.medicalHistory);
          setValue('familyHistory', profile.familyHistory);
          setValue('insuranceDetails', profile.insuranceDetails);
        }
      } catch (err) {
        console.error('Failed to load profile details', err);
      }
    };
    loadProfile();
  }, [user, setValue]);

  const onSubmit = async (values: any) => {
    setIsUpdating(true);
    setSuccessMsg(null);
    try {
      const res = await api.put(`/patients/${user?.profileId}`, values);
      if (res.data.success) {
        setSuccessMsg('Profile updated successfully.');
      }
    } catch (err) {
      console.error('Failed to update patient profile', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  const bloodOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Personal & Clinical Details</h2>
        <p className="text-xs text-slate-500 mt-1">Manage demographics, physical metrics, allergies, and history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5.5 w-5.5 text-brand-600" />
            <span>Profile Informational Record</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={user?.name}
                disabled
                className="bg-slate-50/50 dark:bg-slate-800/20 text-slate-400"
              />
              <Input
                label="Account Email"
                value={user?.email}
                disabled
                className="bg-slate-50/50 dark:bg-slate-800/20 text-slate-400"
              />

              <Input
                label="Age (Years)"
                placeholder="25"
                {...register('age')}
              />
              <Select
                label="Gender"
                options={genderOptions}
                {...register('gender')}
              />
              <Select
                label="Blood Group"
                options={bloodOptions}
                {...register('bloodGroup')}
              />
              <Input
                label="Weight (kg)"
                placeholder="70"
                {...register('weight')}
              />
              <Input
                label="Height (cm)"
                placeholder="175"
                {...register('height')}
              />
            </div>

            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Background Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Allergies Summary"
                  placeholder="None"
                  {...register('allergies')}
                />
                <Input
                  label="Medical History Summary"
                  placeholder="None"
                  {...register('medicalHistory')}
                />
                <Input
                  label="Family History Summary"
                  placeholder="None"
                  {...register('familyHistory')}
                />
                <Input
                  label="Insurance Details"
                  placeholder="None"
                  {...register('insuranceDetails')}
                />
              </div>
            </div>

            {successMsg && (
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              isLoading={isUpdating}
              className="w-full md:w-auto font-bold px-6"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

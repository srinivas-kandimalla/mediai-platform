import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent, Input, Select, Button } from '../components/ui/CustomComponents';
import { HeartPulse, AlertCircle } from 'lucide-react';

const patientRegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  age: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: 'Age must be a positive number' }),
  gender: z.string().min(1, { message: 'Gender is required' }),
  bloodGroup: z.string().min(1, { message: 'Blood group is required' }),
  weight: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: 'Weight must be a positive number' }),
  height: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: 'Height must be a positive number' }),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  insuranceDetails: z.string().optional(),
});

type PatientRegisterFormValues = z.infer<typeof patientRegisterSchema>;

export const RegisterPatient: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerAction, error: authError, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PatientRegisterFormValues>({
    resolver: zodResolver(patientRegisterSchema),
    defaultValues: {
      gender: 'Male',
      bloodGroup: 'O+',
      allergies: 'None',
      medicalHistory: 'None',
      familyHistory: 'None',
      insuranceDetails: 'None',
    }
  });

  const onSubmit = async (values: PatientRegisterFormValues) => {
    setIsLoading(true);
    clearError();
    try {
      await registerAction({
        ...values,
        role: 'PATIENT',
      });
      navigate('/login');
    } catch (err) {
      // Handled by store error binding
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-slate-950 py-12 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <div className="bg-brand-600 p-2.5 rounded-xl text-white shadow-xl">
            <HeartPulse className="h-6.5 w-6.5 animate-pulse-subtle" />
          </div>
          <h2 className="font-extrabold text-2xl tracking-tight text-white">Create Patient Account</h2>
          <p className="text-xs text-slate-400">Fill in your information to join MediAI Portal</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Email address"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Input
                  label="Age"
                  placeholder="35"
                  error={errors.age?.message}
                  {...register('age')}
                />
                <Select
                  label="Gender"
                  options={genderOptions}
                  error={errors.gender?.message}
                  {...register('gender')}
                />
                <Select
                  label="Blood Group"
                  options={bloodOptions}
                  error={errors.bloodGroup?.message}
                  {...register('bloodGroup')}
                />
                <Input
                  label="Weight (kg)"
                  placeholder="70"
                  error={errors.weight?.message}
                  {...register('weight')}
                />
                <Input
                  label="Height (cm)"
                  placeholder="175"
                  error={errors.height?.message}
                  {...register('height')}
                />
              </div>

              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Background Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Allergies (e.g. Penicillin, Peanuts)"
                    placeholder="None"
                    error={errors.allergies?.message}
                    {...register('allergies')}
                  />
                  <Input
                    label="Existing Medical History"
                    placeholder="None"
                    error={errors.medicalHistory?.message}
                    {...register('medicalHistory')}
                  />
                  <Input
                    label="Family Medical History"
                    placeholder="None"
                    error={errors.familyHistory?.message}
                    {...register('familyHistory')}
                  />
                  <Input
                    label="Insurance Provider Details"
                    placeholder="None"
                    error={errors.insuranceDetails?.message}
                    {...register('insuranceDetails')}
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-clinical-rose text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-1/3 py-2.5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-2/3 py-2.5 font-bold"
                >
                  Register Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

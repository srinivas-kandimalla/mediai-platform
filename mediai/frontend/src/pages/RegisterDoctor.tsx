import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent, Input, Select, Button } from '../components/ui/CustomComponents';
import { HeartPulse, AlertCircle } from 'lucide-react';

const doctorRegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  specialization: z.string().min(1, { message: 'Specialization is required' }),
  department: z.string().min(1, { message: 'Department is required' }),
  experience: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: 'Experience must be a positive number' }),
  qualification: z.string().min(1, { message: 'Qualification credentials are required' }),
  licenseNumber: z.string().min(1, { message: 'Medical license number is required' }),
});

type DoctorRegisterFormValues = z.infer<typeof doctorRegisterSchema>;

export const RegisterDoctor: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerAction, error: authError, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<DoctorRegisterFormValues>({
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: {
      specialization: 'General Practitioner',
      department: 'General Medicine',
      qualification: 'MBBS, MD',
    }
  });

  const onSubmit = async (values: DoctorRegisterFormValues) => {
    setIsLoading(true);
    clearError();
    try {
      await registerAction({
        ...values,
        role: 'DOCTOR',
      });
      navigate('/login');
    } catch (err) {
      // Handled by store
    } finally {
      setIsLoading(false);
    }
  };

  const deptOptions = [
    { value: 'General Medicine', label: 'General Medicine' },
    { value: 'ICU', label: 'ICU / Intensive Care' },
    { value: 'Emergency Wards', label: 'Emergency Medicine' },
    { value: 'Cardiology', label: 'Cardiology' },
    { value: 'Pulmonology', label: 'Pulmonology' },
    { value: 'Neurology', label: 'Neurology' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-12 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <div className="bg-brand-600 p-2.5 rounded-xl text-white shadow-xl">
            <HeartPulse className="h-6.5 w-6.5 animate-pulse-subtle" />
          </div>
          <h2 className="font-extrabold text-2xl tracking-tight text-white">Join as Medical Practitioner</h2>
          <p className="text-xs text-slate-400">Register your doctor profile to start managing clinical care</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Practitioner Full Name"
                  placeholder="Jane Smith"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Clinical Email"
                  placeholder="dr.jane@mediai.org"
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
                  label="Years of Experience"
                  placeholder="8"
                  error={errors.experience?.message}
                  {...register('experience')}
                />
                <Input
                  label="Specialization Field"
                  placeholder="Cardiothoracic Surgery"
                  error={errors.specialization?.message}
                  {...register('specialization')}
                />
                <Select
                  label="Target Department"
                  options={deptOptions}
                  error={errors.department?.message}
                  {...register('department')}
                />
                <Input
                  label="Medical Qualifications"
                  placeholder="MBBS, MD (Cardiology)"
                  error={errors.qualification?.message}
                  {...register('qualification')}
                />
                <Input
                  label="Medical License Number"
                  placeholder="MC-992384"
                  error={errors.licenseNumber?.message}
                  {...register('licenseNumber')}
                />
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
                  Register Doctor Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

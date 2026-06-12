import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '../components/ui/CustomComponents';
import { HeartPulse, KeyRound, Mail, AlertCircle } from 'lucide-react';

// Zod Validation Schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, error: authError, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    clearError();
    try {
      const user = await login(values);
      // Route based on role
      if (user.role === 'PATIENT') {
        navigate('/patient/dashboard');
      } else if (user.role === 'DOCTOR') {
        navigate('/doctor/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      // Handled by store error binding
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Branding Logo */}
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <div className="bg-brand-600 p-3 rounded-2xl text-white shadow-xl shadow-brand-500/10">
            <HeartPulse className="h-7 w-7 animate-pulse-subtle" />
          </div>
          <h2 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-slate-450 bg-clip-text text-transparent">
            Welcome to MediAI
          </h2>
          <p className="text-xs text-slate-450">Clinical Telemetry & Resource Operations Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-center">Sign In to Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="doctor@mediai.org or patient@mediai.org"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Account Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              {authError && (
                <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 text-clinical-rose text-xs font-semibold flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <Button type="submit" isLoading={isLoading} className="w-full font-bold">
                Access Account
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center space-y-2.5">
              <p className="text-xs text-slate-450">
                New patient?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="font-bold text-brand-500 hover:underline"
                >
                  Create Patient Account
                </button>
              </p>
              <p className="text-[11px] text-slate-500">
                Are you a clinical specialist?{' '}
                <button
                  onClick={() => navigate('/register/doctor')}
                  className="font-bold text-slate-350 hover:underline"
                >
                  Register as Doctor
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

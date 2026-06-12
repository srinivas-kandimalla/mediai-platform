import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/CustomComponents';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="bg-red-500/10 text-clinical-rose p-4 rounded-full inline-block">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">403 - Forbidden Access</h1>
          <p className="text-xs text-slate-450 leading-relaxed">
            Your current account role does not have authorization to view this clinical console node. Please check your credentials or contact an administrator.
          </p>
        </div>
        <Button onClick={() => navigate('/')} className="px-6 py-2.5 font-bold mx-auto">
          Return to Portal
        </Button>
      </div>
    </div>
  );
};

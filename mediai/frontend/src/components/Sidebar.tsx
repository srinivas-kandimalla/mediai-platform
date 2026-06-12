import React from 'react';
import { useAuthStore } from '../store/authStore';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, User, Calendar, FileText, UploadCloud, 
  Brain, Bot, Users, ClipboardCheck, Stethoscope, 
  Bed, HardDrive, ShieldAlert, BarChart3 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  // Define links based on user roles
  const getLinks = () => {
    switch (user.role) {
      case 'PATIENT':
        return [
          { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/patient/profile', label: 'My Profile', icon: User },
          { to: '/patient/appointments', label: 'Bookings', icon: Calendar },
          { to: '/patient/ehr', label: 'Health Record (EHR)', icon: FileText },
          { to: '/patient/lab-reports', label: 'Lab Reports', icon: UploadCloud },
          { to: '/patient/predictions', label: 'AI Risk Predictor', icon: Brain },
          { to: '/patient/chatbot', label: 'MediBot Chat', icon: Bot },
        ];
      case 'DOCTOR':
        return [
          { to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/doctor/patients', label: 'Assigned Patients', icon: Users },
          { to: '/doctor/appointments', label: 'Appointments', icon: Calendar },
          { to: '/doctor/predictions', label: 'Patient AI Risks', icon: Brain },
          { to: '/doctor/recommendations', label: 'Clinical Planner', icon: Stethoscope },
          { to: '/doctor/reports', label: 'Lab Reports', icon: FileText },
        ];
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
          { to: '/admin/beds', label: 'Beds Manager', icon: Bed },
          { to: '/admin/resources', label: 'Supplies Inventory', icon: HardDrive },
          { to: '/admin/staff', label: 'AI Staff Scheduler', icon: ClipboardCheck },
          { to: '/admin/alerts', label: 'Emergency Alerts', icon: ShieldAlert },
          { to: '/admin/analytics', label: 'System Analytics', icon: BarChart3 },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1322] min-h-[calc(100vh-73px)] p-4 flex flex-col gap-1.5 shrink-0">
      <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-2">
        Main Menu
      </div>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/45 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
};

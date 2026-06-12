import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, X } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface NotifItem {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  isRead: boolean;
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const res = await api.get(`/patients/${user.id}/notifications`).catch(() => null);
        if (res && res.data.success) {
          setNotifications(res.data.data);
        }
      } catch (err) {
        // Fallback or ignore
      }
    };
    fetchNotifications();

    // Listen to real-time events on window context or direct document listeners
    const handleAlert = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setNotifications((prev) => [
          {
            id: String(Date.now()),
            title: detail.title || '🚨 EMERGENCY ALERT',
            body: detail.message || detail.body || 'A new alert has been triggered',
            sentAt: new Date().toISOString(),
            isRead: false,
          },
          ...prev,
        ]);
      }
    };

    window.addEventListener('mediai_emergency_alert', handleAlert);
    window.addEventListener('mediai_push_notification', handleAlert);

    return () => {
      window.removeEventListener('mediai_emergency_alert', handleAlert);
      window.removeEventListener('mediai_push_notification', handleAlert);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
      >
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-clinical-rose text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Alerts & Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No recent notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 flex gap-3 items-start relative transition-colors ${
                    notif.isRead ? 'opacity-85' : 'bg-brand-50/40 dark:bg-slate-800/40'
                  }`}
                >
                  <AlertCircle className="h-4 w-4 text-clinical-rose mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{notif.title}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{notif.body}</p>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      {new Date(notif.sentAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    onClick={() => removeNotification(notif.id)}
                    className="text-slate-400 hover:text-slate-650"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

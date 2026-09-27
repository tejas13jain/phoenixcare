import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../ui/index.js';
import { usePushNotifications } from '../../hooks/usePushNotifications.js';
import { useAuthStore } from '../../store/slices/authStore.js';

const DISMISS_KEY = 'phoenixcare-engagement-dismissed-until';
const DISMISS_DAYS = 7;

export function EngagementBanner() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuthStore();
  const { permission, subscribing, subscribe, supported } = usePushNotifications();

  useEffect(() => {
    const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() < until) setDismissed(true);

    const handler = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  };

  const handleEnableNotifications = async () => {
    const result = await subscribe();
    if (result.ok) toast.success("You're subscribed — we'll notify you about appointments and reminders.");
    else if (result.reason === 'denied') toast.error('Notifications blocked — you can enable them in browser settings anytime.');
    else if (result.reason === 'not_configured') toast('Push notifications are not configured on this server yet.', { icon: 'ℹ️' });
  };

  const showInstall = !!installPromptEvent;
  const showNotify = supported && permission === 'default' && !!user;

  if (dismissed || (!showInstall && !showNotify)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="bg-phoenix-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 text-white text-sm">
            {showInstall ? (
              <Download size={18} className="shrink-0" />
            ) : (
              <Bell size={18} className="shrink-0" />
            )}
            <span className="flex-1">
              {showInstall
                ? 'Install PhoenixCare for quick, app-like access from your home screen.'
                : "Turn on notifications so you never miss an appointment or health reminder."}
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="!bg-white/20 !text-white hover:!bg-white/30 shrink-0"
              loading={subscribing}
              onClick={showInstall ? handleInstall : handleEnableNotifications}
            >
              {showInstall ? 'Install' : 'Enable'}
            </Button>
            <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 p-1 hover:bg-white/10 rounded-full">
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoenixIcon } from '../../assets/logo/PhoenixIcon.jsx';

const SPLASH_SEEN_KEY = 'phoenixcare-splash-seen';

export function SplashScreen() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(SPLASH_SEEN_KEY));

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
      setVisible(false);
    }, 1900);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-phoenix-gradient"
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <PhoenixIcon size={96} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-5 font-heading font-bold text-2xl text-white tracking-wide"
          >
            PhoenixCare
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="mt-1 text-white/85 text-sm font-body"
          >
            Rise stronger, every day.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

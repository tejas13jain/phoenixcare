import { motion } from 'framer-motion';
import clsx from 'clsx';

export function Card({ children, className = '', hoverLift = false, as: Component = motion.div, ...props }) {
  return (
    <Component
      whileHover={hoverLift ? { y: -6, boxShadow: '0 20px 40px -12px rgba(30,42,50,0.18)' } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={clsx('bg-white rounded-2xl shadow-soft p-5', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

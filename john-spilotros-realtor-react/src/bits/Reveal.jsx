/* Reveal — scroll-into-view rise. Replaces the old data-reveal IntersectionObserver. */
import { motion } from 'motion/react';
import useMotionOK from './useMotionOK.js';

export default function Reveal({ children, className = '', delay = 0, y = 22 }) {
  const motionOK = useMotionOK();
  if (!motionOK) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

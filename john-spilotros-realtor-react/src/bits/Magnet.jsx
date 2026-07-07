/* Magnet — element leans toward the cursor, springs back on leave. Inspired by reactbits.dev/animations/magnet (MIT). */
import { motion, useSpring, useReducedMotion } from 'motion/react';

export default function Magnet({ children, strength = 0.32, className = '' }) {
  const reduced = useReducedMotion();
  const x = useSpring(0, { stiffness: 180, damping: 16 });
  const y = useSpring(0, { stiffness: 180, damping: 16 });

  if (reduced) return <span className={className} style={{ display: 'inline-flex' }}>{children}</span>;

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function onLeave() { x.set(0); y.set(0); }

  return (
    <motion.span className={'magnet ' + className} style={{ x, y }} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </motion.span>
  );
}

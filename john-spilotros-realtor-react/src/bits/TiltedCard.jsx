/* TiltedCard — 3D tilt that follows the pointer. Inspired by reactbits.dev/components/tilted-card (MIT). */
import { motion, useSpring, useReducedMotion } from 'motion/react';

export default function TiltedCard({ children, className = '', max = 8, scale = 1.015 }) {
  const reduced = useReducedMotion();
  const rx = useSpring(0, { stiffness: 220, damping: 20 });
  const ry = useSpring(0, { stiffness: 220, damping: 20 });
  const s = useSpring(1, { stiffness: 220, damping: 22 });

  if (reduced) return <div className={className}>{children}</div>;

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(-py * max);
    ry.set(px * max);
  }
  function onLeave() { rx.set(0); ry.set(0); s.set(1); }

  return (
    <motion.div
      className={'tilt ' + className}
      style={{ rotateX: rx, rotateY: ry, scale: s, transformPerspective: 1000 }}
      onPointerMove={onMove}
      onPointerEnter={() => s.set(scale)}
      onPointerLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}

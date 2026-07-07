/* CountUp — springs a number to its new value. Inspired by reactbits.dev/text-animations/count-up (MIT). */
import { useEffect } from 'react';
import { motion, useSpring, useTransform, useReducedMotion } from 'motion/react';

export default function CountUp({ value, format = (v) => Math.round(v).toLocaleString('en-US') }) {
  const reduced = useReducedMotion();
  const spring = useSpring(value, { stiffness: 110, damping: 24 });
  useEffect(() => { spring.set(value); }, [value, spring]);
  const text = useTransform(spring, (v) => format(v));
  if (reduced) return <span>{format(value)}</span>;
  return <motion.span>{text}</motion.span>;
}

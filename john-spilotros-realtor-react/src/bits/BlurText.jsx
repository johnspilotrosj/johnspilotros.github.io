/* BlurText — words blur into focus on scroll. Inspired by reactbits.dev/text-animations/blur-text (MIT). */
import { motion } from 'motion/react';
import useMotionOK from './useMotionOK.js';

export default function BlurText({ text, stagger = 0.04, duration = 0.6, className = '' }) {
  const motionOK = useMotionOK();
  if (!motionOK) return <span className={className}>{text}</span>;
  const words = text.split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          style={{ display: 'inline-block' }}
          initial={{ opacity: 0, filter: 'blur(8px)', y: 8 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ delay: i * stagger, duration, ease: [0.22, 1, 0.36, 1] }}
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </span>
  );
}

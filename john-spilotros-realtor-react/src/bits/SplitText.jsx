/* SplitText — staggered word rise-in. Inspired by reactbits.dev/text-animations/split-text (MIT). */
import { motion } from 'motion/react';
import useMotionOK from './useMotionOK.js';

export default function SplitText({ text, delay = 0, stagger = 0.045, duration = 0.7, className = '' }) {
  const motionOK = useMotionOK();
  if (!motionOK) return <span className={className}>{text}</span>;
  const words = text.split(' ');
  return (
    <span className={'st ' + className} aria-label={text}>
      {words.map((w, i) => (
        <span className="st-mask" key={i} aria-hidden="true">
          <motion.span
            className="st-word"
            initial={{ y: '112%' }}
            animate={{ y: 0 }}
            transition={{ delay: delay + i * stagger, duration, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

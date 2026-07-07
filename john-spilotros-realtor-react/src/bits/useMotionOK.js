import { useReducedMotion } from 'motion/react';

/* Entrance animations are skipped when the user asked for reduced motion OR
   the document is hidden at mount (background tab, headless renderer, print):
   JS animation frames pause there, which would leave initial-hidden content
   invisible. Content must never be gated on an animation that can't run. */
export default function useMotionOK() {
  const reduced = useReducedMotion();
  return !reduced && (typeof document === 'undefined' || document.visibilityState !== 'hidden');
}

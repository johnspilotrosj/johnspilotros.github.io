/* Magnet — motion trimmed per the 2026-07-24 design review: renders children in
   place with no cursor-lean (the effect read as a dated tic on a trust-first
   real estate site). API and layout are unchanged, so restoring the effect is a
   single-file revert from git history. */
export default function Magnet({ children, className = '' }) {
  return <span className={className} style={{ display: 'inline-flex' }}>{children}</span>;
}

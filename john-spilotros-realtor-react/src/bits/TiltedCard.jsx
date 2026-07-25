/* TiltedCard — motion trimmed per the 2026-07-24 design review: renders a static
   card with no 3D tilt (perspective-skewing the listing photo buyers scrutinize
   read as a gimmick). API and layout are unchanged, so restoring the tilt is a
   single-file revert from git history. */
export default function TiltedCard({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

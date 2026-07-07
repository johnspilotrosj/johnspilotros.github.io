/* SpotlightCard — clay-tinted spotlight follows the mouse. Inspired by reactbits.dev/components/spotlight-card (MIT). */
export default function SpotlightCard({ children, className = '', as: Tag = 'div' }) {
  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  }
  return (
    <Tag className={'spotlight-card ' + className} onMouseMove={onMove}>
      {children}
    </Tag>
  );
}

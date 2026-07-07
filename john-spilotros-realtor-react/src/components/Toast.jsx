import { useEffect, useRef, useState } from 'react';

export function toast(msg) {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: msg }));
}

export default function Toaster() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    function onToast(e) {
      setMsg(e.detail);
      setShow(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setShow(false), 4200);
    }
    window.addEventListener('app:toast', onToast);
    return () => { window.removeEventListener('app:toast', onToast); clearTimeout(timer.current); };
  }, []);

  return (
    <div className={'toast' + (show ? ' show' : '')} role="status" aria-live="polite">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
      <span>{msg}</span>
    </div>
  );
}

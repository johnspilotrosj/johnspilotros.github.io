/* ClickSpark — small clay sparks burst from every click. Inspired by reactbits.dev/animations/click-spark (MIT). */
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

const SPARK_COLOR = '#b3924f'; /* muted gold */
const SPARKS = 8;
const DURATION = 420; /* ms */

export default function ClickSpark() {
  const canvasRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let sparks = [];
    let raf = 0;

    function resize() {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw(now) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparks = sparks.filter((sp) => now - sp.start < DURATION);
      for (const sp of sparks) {
        const t = (now - sp.start) / DURATION; /* 0..1 */
        const eased = 1 - Math.pow(1 - t, 3);
        for (let i = 0; i < SPARKS; i++) {
          const angle = (Math.PI * 2 * i) / SPARKS;
          const dist = 6 + eased * 22;
          const len = 8 * (1 - eased);
          ctx.strokeStyle = SPARK_COLOR;
          ctx.globalAlpha = 1 - t;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sp.x + Math.cos(angle) * dist, sp.y + Math.sin(angle) * dist);
          ctx.lineTo(sp.x + Math.cos(angle) * (dist + len), sp.y + Math.sin(angle) * (dist + len));
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      raf = sparks.length ? requestAnimationFrame(draw) : 0;
    }

    function onClick(e) {
      sparks.push({ x: e.clientX, y: e.clientY, start: performance.now() });
      if (!raf) raf = requestAnimationFrame(draw);
    }
    window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  if (reduced) return null;
  return <canvas ref={canvasRef} className="click-spark-canvas" aria-hidden="true" />;
}

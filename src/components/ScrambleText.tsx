import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export default function ScrambleText({ text, onHover = false }: { text: string; onHover?: boolean }) {
  const [display, setDisplay] = useState(text);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduced = useReducedMotion();
  const stop = useCallback(() => { if (timer.current) clearInterval(timer.current); timer.current = null; setDisplay(text); }, [text]);
  const start = useCallback(() => {
    if (reduced) { stop(); return; }
    if (timer.current) clearInterval(timer.current);
    let frame = 0;
    timer.current = setInterval(() => {
      frame++;
      const revealed = Math.floor(frame / 2);
      setDisplay(Array.from(text, (letter, index) => index < revealed || letter === ' ' ? letter : alphabet[Math.floor(Math.random() * alphabet.length)]).join(''));
      if (revealed >= text.length) stop();
    }, 25);
  }, [reduced, stop, text]);
  useEffect(() => {
    if (!onHover) start();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [start, onHover]);
  return <span onMouseEnter={onHover ? start : undefined} onMouseLeave={onHover ? stop : undefined}>
    <span className="sr-only">{text}</span><span aria-hidden="true">{display}</span>
  </span>;
}

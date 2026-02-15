import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * Returns count that animates from 0 to target when observedRef is in view.
 * duration in ms, suffix e.g. "+" or "%".
 */
export function useCountUp(
  target: number,
  options: { duration?: number; suffix?: string; observedRef?: RefObject<HTMLElement | null> } = {}
): string {
  const { duration = 1800, suffix = '', observedRef } = options;
  const [value, setValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const el = observedRef?.current;
    if (!el) {
      setHasStarted(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasStarted) setHasStarted(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [observedRef, hasStarted]);

  useEffect(() => {
    if (!hasStarted || target <= 0) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 2);
      setValue(Math.round(target * easeOut));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [hasStarted, target, duration]);

  return `${value}${suffix}`;
}

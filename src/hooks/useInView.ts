import { useState, useEffect, useRef, RefObject } from 'react';

export function useInView(options?: { threshold?: number }): [boolean, RefObject<HTMLDivElement>] {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const threshold = options?.threshold ?? 0.15;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setIsInView(true);
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [isInView, ref];
}

import { useEffect } from 'react';

export const ThemeShiftController = () => {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-theme]'));
    if (sections.length === 0) return;

    const onIntersect: IntersectionObserverCallback = (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) {
        const theme = (visible[0].target as HTMLElement).dataset.theme;
        if (theme) {
          document.body.setAttribute('data-theme', theme);
        }
      }
    };

    const io = new IntersectionObserver(onIntersect, { threshold: [0.25, 0.5, 0.75] });
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return null;
};
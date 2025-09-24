import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiBurstProps {
  pieces?: number;
  duration?: number;
}

export const ConfettiBurst = ({ pieces = 18, duration = 900 }: ConfettiBurstProps) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);
  const colors = ['#FF6B35', '#FFBD45', '#FFD166', '#06D6A0', '#118AB2', '#EF476F'];
  const confetti = useMemo(
    () => Array.from({ length: pieces }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 160,
      y: -Math.random() * 120 - 40,
      r: Math.random() * 360,
      s: 0.6 + Math.random() * 0.8,
      c: colors[Math.floor(Math.random() * colors.length)],
      d: 500 + Math.random() * 700,
    })),
    [pieces]
  );
  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[70]">
      {confetti.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: p.s }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.r }}
          transition={{ duration: p.d / 1000, ease: 'easeOut' }}
          style={{ width: 8, height: 8, backgroundColor: p.c, borderRadius: 2, position: 'absolute', left: '50%', top: '60%' }}
        />)
      )}
    </div>
  );
};
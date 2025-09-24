import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number; // how strong the magnetic effect is
  as?: keyof HTMLElementTagNameMap;
  onClick?: () => void;
  disabled?: boolean;
}

export const MagneticButton = ({
  children,
  className,
  strength = 0.25,
  as = 'button',
  onClick,
  disabled,
}: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setOffset({ x: x * strength, y: y * strength });
    };

    const handleMouseLeave = () => setOffset({ x: 0, y: 0 });

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  const Comp: any = as || 'button'; // render as native element, e.g., 'button'

  return (
    <div ref={ref} className="inline-block">
      <motion.div animate={{ x: offset.x, y: offset.y }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
        <Comp className={className} onClick={onClick} disabled={disabled}>
          {children}
        </Comp>
      </motion.div>
    </div>
  );
};
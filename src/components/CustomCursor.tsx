import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const updateCursorType = () => {
      const el = document.elementFromPoint(mousePosition.x, mousePosition.y) as HTMLElement | null;
      if (el) {
        const isClickable =
          el.tagName === 'A' ||
          el.tagName === 'BUTTON' ||
          el.closest('a,button,[role="button"],.cursor-pointer') !== null ||
          window.getComputedStyle(el).cursor === 'pointer';
        setIsPointer(!!isClickable);
      } else {
        setIsPointer(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', updateCursorType);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', updateCursorType);
    };
  }, [mousePosition.x, mousePosition.y]);

  // Hide on mobile devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  return (
    <>
      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999]"
        style={{
          background: isPointer ? '#dc2626' : '#ef4444',
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
        }}
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: isPointer ? 1.5 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 600,
          damping: 30,
        }}
      />
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9998]"
        style={{
          border: `1.5px solid ${isPointer ? '#dc2626' : '#ef4444'}`,
          backgroundColor: isPointer ? 'rgba(220, 38, 38, 0.1)' : 'transparent'
        }}
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isPointer ? 1.3 : 1,
          rotate: isPointer ? 180 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          rotate: { duration: 0.5 }
        }}
      />
    </>
  );
};
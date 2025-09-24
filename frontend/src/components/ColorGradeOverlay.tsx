import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';

export const ColorGradeOverlay = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 1], [0.15, 0.25, 0.2, 0.15]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const hue = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [0, 25, -15, 0]);
  const saturate = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const brightness = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const filterMV = useMotionTemplate`hue-rotate(${hue}deg) saturate(${saturate}) brightness(${brightness})`;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-10"
      style={{ opacity }}
    >
      <motion.div style={{ rotate, filter: filterMV }} className="absolute -inset-1">
        <div className="absolute inset-0 opacity-60" style={{
          background: 'radial-gradient(60% 40% at 10% 10%, rgba(255,213,196,0.35) 0%, rgba(255,255,255,0) 60%), radial-gradient(60% 40% at 90% 20%, rgba(200,225,255,0.25) 0%, rgba(255,255,255,0) 60%), radial-gradient(60% 50% at 50% 100%, rgba(255,230,180,0.25) 0%, rgba(255,255,255,0) 60%)'
        }} />
        <div className="absolute inset-0 mix-blend-multiply" style={{
          background: 'linear-gradient(135deg, rgba(255, 153, 102, 0.08), rgba(255, 204, 204, 0.08))'
        }} />
      </motion.div>
    </motion.div>
  );
};
import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
 
/**
 * LogoBackground component
 * - Fixed, full-screen, centered SVG logo as a watermark
 * - Responsive, low opacity, 3D tilt on mouse move
 * - Use on chat assistant page only
 */
const LogoBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
 
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { width, height, left, top } = containerRef.current.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      // Calculate rotation: -10deg to 10deg
      const rotateYVal = ((x / width) - 0.5) * 20;
      const rotateXVal = ((0.5 - y / height)) * 20;
      rotateX.set(rotateXVal);
      rotateY.set(rotateYVal);
    };
    const node = containerRef.current;
    if (node) {
      node.addEventListener('mousemove', handleMouseMove);
      node.addEventListener('mouseleave', () => {
        rotateX.set(0);
        rotateY.set(0);
      });
    }
    return () => {
      if (node) {
        node.removeEventListener('mousemove', handleMouseMove);
        node.removeEventListener('mouseleave', () => {
          rotateX.set(0);
          rotateY.set(0);
        });
      }
    };
  }, [rotateX, rotateY]);
 
  return (
    <div
      ref={containerRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none flex items-center justify-center select-none w-full h-full"
      aria-hidden="true"
    >
      <motion.img
        src="/images/nicorai-logo-black.svg"
        alt="Nicorai Logo Watermark"
        className="w-1/4 max-w-[120px] md:max-w-[180px] lg:max-w-[220px] opacity-5 md:opacity-10"
        style={{
          rotateX,
          rotateY,
          willChange: 'transform',
        }}
        draggable={false}
      />
    </div>
  );
};
 
export default LogoBackground;
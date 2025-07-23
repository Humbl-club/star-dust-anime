import { useEffect } from 'react';
import { useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export const useScrollAnimation = (options?: {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: options?.threshold ?? 0.1,
    triggerOnce: options?.triggerOnce ?? true,
    rootMargin: options?.rootMargin ?? '50px',
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const variants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      filter: 'blur(10px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1], // Custom easing
        staggerChildren: 0.1,
      },
    },
  };

  return { ref, controls, variants };
};
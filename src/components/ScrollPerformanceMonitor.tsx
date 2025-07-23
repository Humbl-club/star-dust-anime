import React, { useState, useEffect } from 'react';

export const ScrollPerformanceMonitor = () => {
  const [fps, setFps] = useState(60);
  const [scrollPerf, setScrollPerf] = useState(100);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let rafId: number;

    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (currentTime - lastTime)));
        frames = 0;
        lastTime = currentTime;
      }

      rafId = requestAnimationFrame(measureFPS);
    };

    // Monitor scroll performance
    let scrollStart = 0;
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScrollStart = () => {
      scrollStart = performance.now();
    };

    const handleScroll = () => {
      handleScrollStart();
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const duration = performance.now() - scrollStart;
        const performance_score = Math.max(0, Math.min(100, 100 - (duration - 16) * 2));
        setScrollPerf(Math.round(performance_score));
      }, 50);
    };

    // Toggle visibility with keyboard shortcut
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyPress);
    measureFPS();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyPress);
      cancelAnimationFrame(rafId);
      clearTimeout(scrollTimeout);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  const getFpsColor = (fps: number) => {
    if (fps >= 50) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPerfColor = (perf: number) => {
    if (perf >= 80) return 'text-green-400';
    if (perf >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-3 rounded-lg text-xs font-mono z-50 select-none">
      <div className="flex flex-col gap-1">
        <div className="text-gray-300 text-[10px]">Performance (Ctrl+Shift+P)</div>
        <div className={`flex items-center gap-2 ${getFpsColor(fps)}`}>
          <span>FPS:</span>
          <span className="font-bold">{fps}</span>
        </div>
        <div className={`flex items-center gap-2 ${getPerfColor(scrollPerf)}`}>
          <span>Scroll:</span>
          <span className="font-bold">{scrollPerf}%</span>
        </div>
      </div>
    </div>
  );
};
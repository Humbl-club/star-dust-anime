import { useCallback, useMemo } from "react";
import Particles from "react-particles";
import { loadSlim } from "tsparticles-slim";

interface ParticleEffectProps {
  className?: string;
  theme?: "action" | "adventure" | "drama" | "fantasy" | "sci-fi" | "romance" | "default";
}

export const ParticleEffect = ({ className = "", theme = "default" }: ParticleEffectProps) => {
  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: any) => {
    // Optional: Handle particles loaded
  }, []);

  const particleConfig = useMemo(() => {
    const baseConfig = {
      background: {
        color: { value: "transparent" },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: { enable: true, mode: "push" },
          onHover: { enable: true, mode: "repulse" },
          resize: true,
        },
        modes: {
          push: { quantity: 4 },
          repulse: { distance: 200, duration: 0.4 },
        },
      },
      particles: {
        color: { value: "#ffffff" },
        links: {
          color: "#ffffff",
          distance: 150,
          enable: false,
          opacity: 0.5,
          width: 1,
        },
        move: {
          direction: "none" as const,
          enable: true,
          outModes: { default: "bounce" as const },
          random: false,
          speed: 2,
          straight: false,
        },
        number: {
          density: { enable: true, area: 800 },
          value: 80,
        },
        opacity: {
          value: 0.5,
        },
        shape: {
          type: "circle" as const,
        },
        size: {
          value: { min: 1, max: 5 },
        },
      },
      detectRetina: true,
    };

    // Theme-specific configurations
    switch (theme) {
      case "action":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: ["#ff4444", "#ff8800", "#ffaa00"] },
            move: { ...baseConfig.particles.move, speed: 6 },
            number: { ...baseConfig.particles.number, value: 120 },
          },
        };
      case "fantasy":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: ["#8844ff", "#aa44ff", "#cc66ff"] },
            shape: { type: "star" as const },
            move: { ...baseConfig.particles.move, speed: 1 },
            number: { ...baseConfig.particles.number, value: 60 },
          },
        };
      case "sci-fi":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: ["#00ffff", "#0088ff", "#4400ff"] },
            links: { ...baseConfig.particles.links, enable: true },
            move: { ...baseConfig.particles.move, speed: 3 },
          },
        };
      case "romance":
        return {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            color: { value: ["#ff88aa", "#ffaacc", "#ffccdd"] },
            shape: { type: "heart" as const },
            move: { ...baseConfig.particles.move, speed: 1.5 },
            number: { ...baseConfig.particles.number, value: 40 },
          },
        };
      default:
        return baseConfig;
    }
  }, [theme]);

  return (
    <Particles
      className={`absolute inset-0 pointer-events-none ${className}`}
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={particleConfig}
    />
  );
};
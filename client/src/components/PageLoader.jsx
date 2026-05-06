import React, { useEffect, useRef, useState } from 'react';

const SVG_NS = 'http://www.w3.org/2000/svg';

const config = {
  particleCount: 68,
  trailSpan: 0.34,
  durationMs: 6000,
  pulseDurationMs: 5400,
  strokeWidth: 4.7,
  lissajousAmp: 24,
  lissajousAmpBoost: 6,
  lissajousAX: 3,
  lissajousBY: 4,
  lissajousPhase: 1.57,
  lissajousYScale: 0.92,
  point(progress, detailScale) {
    const t = progress * Math.PI * 2;
    const amp = this.lissajousAmp + detailScale * this.lissajousAmpBoost;
    return {
      x: 50 + Math.sin(Math.round(this.lissajousAX) * t + this.lissajousPhase) * amp,
      y: 50 + Math.sin(Math.round(this.lissajousBY) * t) * (amp * this.lissajousYScale),
    };
  },
};

function normalizeProgress(progress) {
  return ((progress % 1) + 1) % 1;
}

function getDetailScale(time) {
  const pulseProgress = (time % config.pulseDurationMs) / config.pulseDurationMs;
  const pulseAngle = pulseProgress * Math.PI * 2;
  return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
}

function buildPath(detailScale, steps = 480) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const point = config.point(index / steps, detailScale);
    return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }).join(' ');
}

function getParticle(index, progress, detailScale) {
  const tailOffset = index / (config.particleCount - 1);
  const point = config.point(normalizeProgress(progress - tailOffset * config.trailSpan), detailScale);
  const fade = Math.pow(1 - tailOffset, 0.56);
  return {
    x: point.x,
    y: point.y,
    radius: 0.9 + fade * 2.7,
    opacity: 0.04 + fade * 0.96,
  };
}

/**
 * PageLoader — Lissajous Drift full-screen loader in brand orange/black.
 * 
 * Props:
 *  - visible (boolean): controls whether the loader is shown
 */
export default function PageLoader({ visible }) {
  const groupRef = useRef(null);
  const pathRef = useRef(null);
  const particleRefs = useRef([]);
  const animRef = useRef(null);
  const startedAtRef = useRef(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Handle visibility transitions
  useEffect(() => {
    if (!visible) {
      setFadeOut(true);
      const timer = setTimeout(() => {
        setHidden(true);
      }, 600); // match the CSS transition duration
      return () => clearTimeout(timer);
    } else {
      setHidden(false);
      setFadeOut(false);
    }
  }, [visible]);

  // Sync with theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    if (hidden) return;

    startedAtRef.current = performance.now();

    function render(now) {
      const group = groupRef.current;
      const path = pathRef.current;
      if (!group || !path) return;

      const time = now - startedAtRef.current;
      const progress = (time % config.durationMs) / config.durationMs;
      const detailScale = getDetailScale(time);

      path.setAttribute('d', buildPath(detailScale));

      particleRefs.current.forEach((node, index) => {
        if (!node) return;
        const particle = getParticle(index, progress, detailScale);
        node.setAttribute('cx', particle.x.toFixed(2));
        node.setAttribute('cy', particle.y.toFixed(2));
        node.setAttribute('r', particle.radius.toFixed(2));
        node.setAttribute('opacity', particle.opacity.toFixed(3));
      });

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      id="page-loader-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? '#0a0a0a' : '#ffffff',
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Subtle radial glow behind the animation */}
      <div
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(234,88,12,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(234,88,12,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* SVG Lissajous Animation */}
      <div style={{ width: 'min(56vmin, 320px)', aspectRatio: '1', position: 'relative' }}>
        <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <g ref={groupRef}>
            <path
              ref={pathRef}
              stroke="#ea580c"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={config.strokeWidth}
              opacity="0.12"
            />
            {Array.from({ length: config.particleCount }, (_, i) => (
              <circle
                key={i}
                ref={el => (particleRefs.current[i] = el)}
                fill="#ea580c"
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Brand text */}
      <div style={{ marginTop: '28px', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'logofont', serif",
            fontSize: '28px',
            fontWeight: 700,
            color: isDark ? '#ffffff' : '#0a0a0a',
            letterSpacing: '0.04em',
          }}
        >
          Campus<span style={{ color: '#ea580c' }} className='font-light'>Node</span>
        </div>
        <div
          style={{
            marginTop: '8px',
            fontSize: '18px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Loading…
        </div>
      </div>
    </div>
  );
}

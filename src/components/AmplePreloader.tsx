import React, { useEffect, useState } from 'react';

interface AmplePreloaderProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const AmplePreloader: React.FC<AmplePreloaderProps> = ({
  onFinish,
  minDurationMs = 2100
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsMounted(false);
        if (onFinish) onFinish();
      }, 600); // match transition duration
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onFinish]);

  if (!isMounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'grid',
        placeItems: 'center',
        alignContent: 'center',
        gap: 'clamp(20px, 3.5vh, 32px)',
        padding: '16px',
        backgroundColor: '#ffffff',
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'all',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      role="progressbar"
      aria-label="Loading Ample Learn"
      aria-busy="true"
    >
      <style>{`
        .ample-trace use {
          fill: none;
          stroke: #244092;
          stroke-width: 2.5;
          stroke-linejoin: round;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation:
            ample-draw 1.4s cubic-bezier(.55, .1, .25, 1) var(--d, 0s) forwards,
            ample-trace-out .8s ease-out 1.7s forwards;
        }
        .ample-base use {
          fill: #244092;
          opacity: 0;
          animation: ample-base-in .9s ease-out 1.3s forwards;
        }
        .ample-sweep rect {
          transform: translateX(-200px) skewX(-18deg);
          animation: ample-sweep 2.2s cubic-bezier(.45, 0, .25, 1) 1.9s infinite;
        }
        .ample-loader__bar {
          position: relative;
          width: min(130px, 40vw);
          height: 3px;
          border-radius: 999px;
          background: rgba(36, 64, 146, .12);
          overflow: hidden;
          opacity: 0;
          animation: ample-fade .8s ease-out .6s forwards;
        }
        .ample-loader__bar i {
          position: absolute;
          inset: 0 auto 0 0;
          width: 38%;
          border-radius: 999px;
          background: #244092;
          animation: ample-slide 1.5s cubic-bezier(.65, 0, .35, 1) 0.8s infinite;
        }
        @keyframes ample-draw { to { stroke-dashoffset: 0; } }
        @keyframes ample-trace-out { to { opacity: 0; } }
        @keyframes ample-base-in { to { opacity: .92; } }
        @keyframes ample-sweep { 0% { transform: translateX(-200px) skewX(-18deg); } 70%, 100% { transform: translateX(520px) skewX(-18deg); } }
        @keyframes ample-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(263%); } }
        @keyframes ample-fade { to { opacity: 1; } }
      `}</style>

      {/* Official Ample Animated SVG Mark from ample-loader-mark.html */}
      <svg
        style={{
          width: 'min(44vw, 170px)',
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          overflow: 'visible'
        }}
        viewBox="72 50 302 322"
        role="img"
        aria-label="Ample Semiconductors"
      >
        <defs>
          <path
            id="ample-mark-a"
            pathLength="1"
            d="M303,234.6l-90.2-90.2l-90.5,90.5l-23.2-23.1L212.8,98.1l113.4,113.3L303,234.6z M364.5,211.5c0-4.2-2.4-8.6-7-13.4c-14.1-14.2-23.2-23.3-27.4-27.3c-2-1.9-2.9-3.6-2.9-5c0-1.4,1-3,3.1-4.8c2-1.8,4.4-4.1,7.2-6.9c1.6-1.6,3.9-4,7.1-7.2l-22.6-22.6l-18.6,18.6l-22.9-22.9l18.5-18.5l-22-22L258,98.5c-0.2-0.2-4-3.9-11.4-11.2c-4.4-4.3-8-8-10.8-11c-5.7-6-10.1-10.2-13-12.6c-3.8-2.9-7.1-4.3-10.1-4.4c-3,0-6.3,1.3-10.1,4.1c-3.2,2.4-7.6,6.6-13.3,12.7c-2.9,3-6.5,6.6-10.8,11c-5.1,5-8.9,8.8-11.6,11.5l-18.9-19l-22.3,22.3l18.5,18.5l-23,23l-18.5-18.5l-22.3,22.3l18.9,19l-31.9,31.9c-4.3,4.4-6.6,8.8-6.7,13.1c-0.1,4.3,2.1,8.7,6.3,13.2c0.9,1,5.3,5.4,13.1,13.3l19.6,19.6l-19.3,19.3c4.1,4,7.1,7,9,8.9c3.4,3.4,6.2,6.3,8.5,8.7c1.7,1.7,3.1,2.6,4.4,2.7c1.2,0,2.6-0.7,4.2-2.3c0.1-0.1,0.2-0.2,0.3-0.3c1.9-2.1,4.2-4.5,7.1-7.4c1.6-1.6,4.1-4.1,7.5-7.4l0.1,0.1l90.9-91.5L322.2,298l22.4-22.4l-18.9-18.9l31.8-32C362.2,220.1,364.5,215.7,364.5,211.5"
          />
          <path
            id="ample-mark-b"
            pathLength="1"
            d="M212.3,325l-22.8-22.8l22.9-22.9l22.8,22.8L212.3,325z M212.9,234.9l-68.8,67.4c-3.4,3.4-6,5.9-7.7,7.6c-2.9,2.9-5.2,5.4-7.1,7.5c-0.7,0.8-1.2,1.9-1.5,3.4c-0.3,1.5-0.3,2.4,0.1,2.9c2.5,2.8,5.7,6.2,9.4,10c2.2,2.2,5.6,5.6,10.3,10.2l19.3-19.2l30.7,30.7c5.4,5.3,10.3,7.9,14.8,8c4.4,0,9.2-2.6,14.7-7.9l31-31l19,19l22.5-22.5L212.9,234.9z"
          />
          <g id="ample-all">
            <use href="#ample-mark-a" />
            <use href="#ample-mark-b" />
          </g>
          <clipPath id="ample-clip">
            <use href="#ample-all" />
          </clipPath>
          <linearGradient id="ample-band" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stop-color="#244092" stop-opacity="0" />
            <stop offset=".5" stop-color="#244092" stop-opacity="1" />
            <stop offset="1" stop-color="#244092" stop-opacity="0" />
          </linearGradient>
        </defs>

        <g className="ample-trace">
          <use href="#ample-mark-a" style={{ ['--d' as any]: '0s' }} />
          <use href="#ample-mark-b" style={{ ['--d' as any]: '.2s' }} />
        </g>

        <g className="ample-base">
          <use href="#ample-mark-a" />
          <use href="#ample-mark-b" />
        </g>

        <g className="ample-sweep" clipPath="url(#ample-clip)">
          <rect x="0" y="40" width="150" height="340" fill="url(#ample-band)" />
        </g>
      </svg>

      <div className="ample-loader__bar">
        <i />
      </div>

      <div style={{
        fontSize: '0.82rem',
        fontWeight: 600,
        color: '#64748b',
        letterSpacing: '0.04em',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        Initializing Ample Silicon Academy...
      </div>
    </div>
  );
};


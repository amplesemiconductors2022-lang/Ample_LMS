import React from 'react';

interface AmpleLMSLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'vertical' | 'mark-only';
  showSubtitle?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export const AmpleLMSLogo: React.FC<AmpleLMSLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  theme = 'light',
  className = ''
}) => {
  // Dimensions map
  const markDimensions = {
    sm: { width: 28, height: 28 },
    md: { width: 42, height: 42 },
    lg: { width: 64, height: 64 },
    xl: { width: 88, height: 88 }
  }[size];

  const titleFontSize = {
    sm: '1.05rem',
    md: '1.35rem',
    lg: '1.9rem',
    xl: '2.5rem'
  }[size];

  const lmsBadgeFontSize = {
    sm: '0.62rem',
    md: '0.72rem',
    lg: '0.85rem',
    xl: '1.05rem'
  }[size];

  // Official Ample Mark from the loading screen end frame
  const MarkSvg = (
    <svg
      width={markDimensions.width}
      height={markDimensions.height}
      viewBox="72 50 302 322"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
      role="img"
      aria-label="Ample Mark"
    >
      <defs>
        <path
          id="ample-end-mark-a"
          d="M303,234.6l-90.2-90.2l-90.5,90.5l-23.2-23.1L212.8,98.1l113.4,113.3L303,234.6z M364.5,211.5c0-4.2-2.4-8.6-7-13.4c-14.1-14.2-23.2-23.3-27.4-27.3c-2-1.9-2.9-3.6-2.9-5c0-1.4,1-3,3.1-4.8c2-1.8,4.4-4.1,7.2-6.9c1.6-1.6,3.9-4,7.1-7.2l-22.6-22.6l-18.6,18.6l-22.9-22.9l18.5-18.5l-22-22L258,98.5c-0.2-0.2-4-3.9-11.4-11.2c-4.4-4.3-8-8-10.8-11c-5.7-6-10.1-10.2-13-12.6c-3.8-2.9-7.1-4.3-10.1-4.4c-3,0-6.3,1.3-10.1,4.1c-3.2,2.4-7.6,6.6-13.3,12.7c-2.9,3-6.5,6.6-10.8,11c-5.1,5-8.9,8.8-11.6,11.5l-18.9-19l-22.3,22.3l18.5,18.5l-23,23l-18.5-18.5l-22.3,22.3l18.9,19l-31.9,31.9c-4.3,4.4-6.6,8.8-6.7,13.1c-0.1,4.3,2.1,8.7,6.3,13.2c0.9,1,5.3,5.4,13.1,13.3l19.6,19.6l-19.3,19.3c4.1,4,7.1,7,9,8.9c3.4,3.4,6.2,6.3,8.5,8.7c1.7,1.7,3.1,2.6,4.4,2.7c1.2,0,2.6-0.7,4.2-2.3c0.1-0.1,0.2-0.2,0.3-0.3c1.9-2.1,4.2-4.5,7.1-7.4c1.6-1.6,4.1-4.1,7.5-7.4l0.1,0.1l90.9-91.5L322.2,298l22.4-22.4l-18.9-18.9l31.8-32C362.2,220.1,364.5,215.7,364.5,211.5"
        />
        <path
          id="ample-end-mark-b"
          d="M212.3,325l-22.8-22.8l22.9-22.9l22.8,22.8L212.3,325z M212.9,234.9l-68.8,67.4c-3.4,3.4-6,5.9-7.7,7.6c-2.9,2.9-5.2,5.4-7.1,7.5c-0.7,0.8-1.2,1.9-1.5,3.4c-0.3,1.5-0.3,2.4,0.1,2.9c2.5,2.8,5.7,6.2,9.4,10c2.2,2.2,5.6,5.6,10.3,10.2l19.3-19.2l30.7,30.7c5.4,5.3,10.3,7.9,14.8,8c4.4,0,9.2-2.6,14.7-7.9l31-31l19,19l22.5-22.5L212.9,234.9z"
        />
        <linearGradient id="ample-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#244092" />
          <stop offset="100%" stopColor="#172b68" />
        </linearGradient>
        <linearGradient id="ample-logo-grad-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <use href="#ample-end-mark-a" fill={theme === 'dark' ? 'url(#ample-logo-grad-dark)' : 'url(#ample-logo-grad)'} />
      <use href="#ample-end-mark-b" fill={theme === 'dark' ? 'url(#ample-logo-grad-dark)' : 'url(#ample-logo-grad)'} />
    </svg>
  );

  if (variant === 'mark-only') {
    return <div className={`inline-flex items-center ${className}`}>{MarkSvg}</div>;
  }

  if (variant === 'vertical') {
    return (
      <div
        className={`flex flex-col items-center text-center ${className}`}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
      >
        <div style={{ marginBottom: size === 'xl' ? '1rem' : '0.65rem' }}>
          {MarkSvg}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center' }}>
          <span style={{
            fontSize: titleFontSize,
            fontWeight: 900,
            color: theme === 'dark' ? '#ffffff' : 'var(--navy-dark, #0f214a)',
            letterSpacing: '0.06em',
            lineHeight: 1
          }}>
            AMPLE
          </span>
          <span style={{
            backgroundColor: 'var(--navy-primary, #244092)',
            color: '#ffffff',
            fontSize: lmsBadgeFontSize,
            fontWeight: 800,
            padding: '0.2rem 0.55rem',
            borderRadius: '9999px',
            letterSpacing: '0.08em',
            boxShadow: '0 2px 6px rgba(36, 64, 146, 0.25)',
            border: theme === 'dark' ? '1px solid rgba(56, 189, 248, 0.3)' : 'none',
            lineHeight: 1
          }}>
            LMS
          </span>
        </div>
        {showSubtitle && (
          <span style={{
            fontSize: size === 'xl' ? '0.85rem' : size === 'lg' ? '0.78rem' : '0.72rem',
            color: theme === 'dark' ? '#94a3b8' : 'var(--text-muted, #64748b)',
            fontWeight: 600,
            marginTop: '0.4rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            Semiconductor Engineering Academy
          </span>
        )}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}
    >
      {MarkSvg}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            fontSize: titleFontSize,
            fontWeight: 900,
            color: theme === 'dark' ? '#ffffff' : 'var(--navy-dark, #0f214a)',
            letterSpacing: '0.05em',
            lineHeight: 1
          }}>
            AMPLE
          </span>
          <span style={{
            backgroundColor: 'var(--navy-primary, #244092)',
            color: '#ffffff',
            fontSize: lmsBadgeFontSize,
            fontWeight: 800,
            padding: '0.15rem 0.45rem',
            borderRadius: '9999px',
            letterSpacing: '0.08em',
            boxShadow: '0 2px 4px rgba(36, 64, 146, 0.2)',
            border: theme === 'dark' ? '1px solid rgba(56, 189, 248, 0.3)' : 'none',
            lineHeight: 1
          }}>
            LMS
          </span>
        </div>
        {showSubtitle && (
          <span style={{
            fontSize: '0.65rem',
            color: theme === 'dark' ? '#94a3b8' : 'var(--text-muted, #64748b)',
            fontWeight: 600,
            letterSpacing: '0.03em',
            marginTop: '0.2rem'
          }}>
            Semiconductors Academy
          </span>
        )}
      </div>
    </div>
  );
};


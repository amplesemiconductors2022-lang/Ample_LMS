import React, { useState, useRef, useEffect } from 'react';
import {
  Award, BookOpen, ShieldCheck, LogIn, LogOut, ChevronDown, ExternalLink
} from 'lucide-react';
import { AmpleLMSLogo } from './AmpleLMSLogo';
import type { User } from '../types';
import '../chrome.css';

interface HeaderProps {
  currentView: 'landing' | 'catalog' | 'dashboard' | 'lesson' | 'admin';
  currentUser: User | null;
  onNavigate: (view: 'landing' | 'catalog' | 'dashboard' | 'admin') => void;
  onOpenAuth: (tab?: 'signin' | 'signup') => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentUser,
  onNavigate,
  onOpenAuth,
  onSignOut
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(6, 8, 14, 0.96)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0.85rem 1.5rem',
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          className="hd-logo"
          onClick={() => onNavigate(currentUser?.role === 'admin' ? 'admin' : 'landing')}
          aria-label="Ample LMS home"
        >
          <AmpleLMSLogo theme="dark" variant="horizontal" size="md" showSubtitle={true} />
        </button>

        <nav className="hd-nav" aria-label="Main">
          {(currentUser?.role === 'admin'
            ? [
              ['admin', 'Admin Management Console', ShieldCheck],
            ] as const
            : currentUser
              ? [
                ['dashboard', 'My dashboard', Award],
                ['catalog', 'Courses', BookOpen],
              ] as const
              : [
                ['landing', 'Overview', null],
                ['catalog', 'Courses', BookOpen],
              ] as const
          ).map(([view, label, Icon]) => (
            <button key={view} onClick={() => onNavigate(view)} aria-current={currentView === view ? 'page' : undefined}>
              {Icon && <Icon size={14} aria-hidden="true" />}{label}
            </button>
          ))}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => window.open('#landing', '_blank')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              title="View live public website"
            >
              <ExternalLink size={14} aria-hidden="true" />
              View Live Website
            </button>
          )}
        </nav>

        {/* Right Actions: User Profile Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

          {currentUser ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <div
                onClick={() => setIsDropdownOpen(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.3rem 0.75rem 0.3rem 0.4rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: currentUser.role === 'admin' ? 'var(--navy-dark, #0f214a)' : 'var(--navy-primary, #244092)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  {getInitials(currentUser.name)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: currentUser.role === 'admin' ? '#fbbf24' : '#38bdf8', fontWeight: 600 }}>
                    {currentUser.role === 'admin' ? 'Admin' : 'Trainee'}
                  </span>
                </div>
                <ChevronDown size={14} color="#cbd5e1" />
              </div>

              {/* User Dropdown Menu */}
              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '260px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.15)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  padding: '0.75rem',
                  zIndex: 100,
                  animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid var(--border-subtle, #e2e8f0)', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--navy-dark, #0f214a)' }}>
                      {currentUser.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                      {currentUser.email}
                    </div>
                    <div style={{ marginTop: '0.35rem' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: currentUser.role === 'admin' ? '#eff6ff' : '#ecfdf5',
                        color: currentUser.role === 'admin' ? '#1d4ed8' : '#059669',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '9999px',
                        border: currentUser.role === 'admin' ? '1px solid #bfdbfe' : '1px solid #a7f3d0'
                      }}>
                        {currentUser.role === 'admin' ? 'Administrator' : 'Verified Student'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => { setIsDropdownOpen(false); onSignOut(); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 0.65rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <button
                onClick={() => onOpenAuth('signin')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '9999px',
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <LogIn size={14} />
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth('signup')}
                className="ample-btn-primary"
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.82rem'
                }}
              >
                Join LMS
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

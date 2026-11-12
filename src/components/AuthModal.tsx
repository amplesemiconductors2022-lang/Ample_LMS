import React, { useState } from 'react';
import { 
  X, Mail, Lock, User as UserIcon, 
  ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { AmpleLMSLogo } from './AmpleLMSLogo';
import { loginUser, signupUser } from '../api/client';
import type { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: (user: User, message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'signin',
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sign In Form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpCampus, setSignUpCampus] = useState('Bengaluru Innovation HQ');
  const [signUpTrack, setSignUpTrack] = useState('VLSI Physical Design & STA');

  if (!isOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!signInEmail.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const { user } = await loginUser(signInEmail, signInPassword);
      onSuccess(user, `Welcome back, ${user.name}!`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please verify your email & password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!signUpName.trim() || !signUpEmail.trim()) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      const { user } = await signupUser({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        campus: signUpCampus,
        targetTrack: signUpTrack
      });
      onSuccess(user, `Welcome to Ample LMS, ${user.name}! Level 1 Certification activated.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign up could not be completed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2.25rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #64748b)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease'
          }}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Brand Header with End-Frame Ample LMS Logo */}
        <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
          <AmpleLMSLogo variant="vertical" size="lg" showSubtitle={true} />
          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: 'var(--navy-dark, #0f214a)',
            marginTop: '1rem',
            marginBottom: '0.25rem'
          }}>
            {activeTab === 'signin' ? 'Sign in to Your Silicon Account' : 'Create Your Ample LMS Account'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary, #475569)', maxWidth: '380px', margin: '0 auto' }}>
            {activeTab === 'signin'
              ? 'Access semiconductor course tracks, campus cohorts, and industry certifications.'
              : 'Join the industry-standard academy mentored by practicing chip architects.'}
          </p>
        </div>

        {/* Tab Toggle Pill Selector */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-secondary, #f8fafc)',
          padding: '0.25rem',
          borderRadius: '9999px',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          marginBottom: '1.5rem',
          marginTop: '1.25rem'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '0.5rem 0',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'signin' ? '#ffffff' : 'transparent',
              color: activeTab === 'signin' ? 'var(--navy-primary, #244092)' : 'var(--text-muted, #64748b)',
              fontWeight: activeTab === 'signin' ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'signin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setErrorMessage(''); }}
            style={{
              flex: 1,
              padding: '0.5rem 0',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'signup' ? '#ffffff' : 'transparent',
              color: activeTab === 'signup' ? 'var(--navy-primary, #244092)' : 'var(--text-muted, #64748b)',
              fontWeight: activeTab === 'signup' ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '12px',
            padding: '0.65rem 0.9rem',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="e.g., varun.reddy@gmail.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem 0.65rem 2.4rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('For administrator access, use admin@amplesemi.com with password: adminpassword (or demo). For trainees, use your registered credentials.')}
                  style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--navy-primary, #244092)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Forgot?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your account password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.4rem 0.65rem 2.4rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #64748b)',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #475569)', cursor: 'pointer' }}>
                Stay signed in on this workstation
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="ample-btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.75rem',
                fontSize: '0.92rem',
                marginTop: '0.4rem'
              }}
            >
              {isLoading ? 'Verifying Credentials...' : 'Sign In to Ample LMS'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g., Varun Reddy"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem 0.65rem 2.4rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                Work or University Email *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="e.g., yourname@university.edu or @company.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem 0.65rem 2.4rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                  Campus Location
                </label>
                <select
                  value={signUpCampus}
                  onChange={(e) => setSignUpCampus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="Bengaluru Innovation HQ">Bengaluru Innovation HQ</option>
                  <option value="Hyderabad Innovation Lab">Hyderabad Innovation Lab</option>
                  <option value="Virtual Engineering Hub">Virtual Engineering Hub</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                  Target Discipline
                </label>
                <select
                  value={signUpTrack}
                  onChange={(e) => setSignUpTrack(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="VLSI Physical Design & STA">VLSI Physical Design</option>
                  <option value="SystemVerilog & UVM Verification">UVM Verification</option>
                  <option value="Embedded Linux & RTOS">Embedded Linux / RTOS</option>
                  <option value="TinyML & Edge AI Silicon">Edge AI & TinyML</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                Set Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.4rem 0.65rem 2.4rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted, #64748b)',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="ample-btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.75rem',
                fontSize: '0.92rem',
                marginTop: '0.4rem'
              }}
            >
              {isLoading ? 'Creating Your Account...' : 'Create Account & Get Certified'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        {/* Footer Guarantee */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.45rem',
          fontSize: '0.76rem',
          color: 'var(--text-muted, #64748b)'
        }}>
          <ShieldCheck size={14} color="#059669" />
          <span>Ample Semiconductors Academy • Verified Industry Credentials</span>
        </div>
      </div>
    </div>
  );
};


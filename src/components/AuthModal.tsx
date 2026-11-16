import { useModalA11y } from '../hooks';
import React, { useState, useEffect } from 'react';
import {
  X, Mail, Lock, User as UserIcon,
  ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, CheckCircle2, RotateCw
} from 'lucide-react';
import { AmpleLMSLogo } from './AmpleLMSLogo';
import { loginUser, signupUser, verifyEmailApi, resendVerificationApi } from '../api/client';
import type { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'signin' | 'signup' | 'verify';
  onClose: () => void;
  onSuccess: (user: User, message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'signin',
  onClose,
  onSuccess
}) => {
  const dialogRef = useModalA11y<HTMLDivElement>(onClose);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'verify'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Sign In Form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpCampus, setSignUpCampus] = useState<'Bengaluru' | 'Hyderabad'>('Bengaluru');
  const [signUpTrack, setSignUpTrack] = useState<'VLSI' | 'Embedded Systems' | 'AIML'>('VLSI');

  // Email Verification Form state
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMessage('');
      setInfoMessage('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
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
      if (err.requiresVerification || (err.message && err.message.toLowerCase().includes('verify your email'))) {
        setSignUpEmail(signInEmail);
        setActiveTab('verify');
        setInfoMessage('Please verify your email to continue. Enter the 6-digit code sent to your inbox.');
      } else {
        setErrorMessage(err.message || 'Invalid credentials. Please verify your email & password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    if (!signUpName.trim() || !signUpEmail.trim()) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signupUser({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        campus: signUpCampus,
        targetTrack: signUpTrack
      });

      if (res.requiresVerification) {
        setActiveTab('verify');
        setVerificationCode('');
        setInfoMessage(res.message || `We sent a 6-digit verification code to ${signUpEmail}. Please check your inbox and Spam folder.`);
      } else if (res.user) {
        onSuccess(res.user, `Welcome to Ample LMS, ${res.user.name}! Your account is now active.`);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign up could not be completed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    const cleanCode = verificationCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyEmailApi({ email: signUpEmail, code: cleanCode });
      onSuccess(res.user, `Email verified! Welcome to Ample LMS, ${res.user.name}.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUpEmail) return;
    setErrorMessage('');
    setInfoMessage('Sending a new code via Brevo...');
    setIsLoading(true);
    try {
      const res = await resendVerificationApi(signUpEmail);
      setInfoMessage(res.message || 'A new 6-digit verification code has been sent to your email inbox.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not resend code. Please try again in a moment.');
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ample LMS Authentication"
        tabIndex={-1}
        className="auth-modal-dialog"
        style={{
          outline: 'none',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '460px',
          height: '525px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.35rem 1.6rem 1.1rem',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.95rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #64748b)',
            cursor: 'pointer',
            padding: '0.35rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease',
            zIndex: 10
          }}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Top Section: Brand Header & Tabs */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: '0.65rem' }}>
            <AmpleLMSLogo variant="vertical" size="md" showSubtitle={true} />
            <h2 style={{
              fontSize: '1.22rem',
              fontWeight: 800,
              color: 'var(--navy-dark, #0f214a)',
              marginTop: '0.45rem',
              marginBottom: '0.15rem'
            }}>
              {activeTab === 'signin'
                ? 'Sign in to Your Silicon Account'
                : activeTab === 'signup'
                  ? 'Create Your Ample LMS Account'
                  : 'Verify Your Email Address'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #475569)', maxWidth: '360px', margin: '0 auto', lineHeight: 1.35 }}>
              {activeTab === 'signin'
                ? 'Access semiconductor courses, campus cohorts, and certifications.'
                : activeTab === 'signup'
                  ? ""
                  : `Enter the 6-digit code sent to ${signUpEmail || 'your email'}`}
            </p>
          </div>

          {/* Tab Selector (Sign In vs Create Account) */}
          {activeTab !== 'verify' && (
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bg-secondary, #f8fafc)',
              padding: '0.2rem',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              marginBottom: '0.85rem'
            }}>
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setErrorMessage(''); setInfoMessage(''); }}
                style={{
                  flex: 1,
                  padding: '0.38rem 0',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: activeTab === 'signin' ? '#ffffff' : 'transparent',
                  color: activeTab === 'signin' ? 'var(--navy-primary, #244092)' : 'var(--text-muted, #64748b)',
                  fontWeight: activeTab === 'signin' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'signin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.18s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setErrorMessage(''); setInfoMessage(''); }}
                style={{
                  flex: 1,
                  padding: '0.38rem 0',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: activeTab === 'signup' ? '#ffffff' : 'transparent',
                  color: activeTab === 'signup' ? 'var(--navy-primary, #244092)' : 'var(--text-muted, #64748b)',
                  fontWeight: activeTab === 'signup' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.18s ease'
                }}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#991b1b',
              borderRadius: '9px',
              padding: '0.45rem 0.75rem',
              marginBottom: '0.7rem',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && !errorMessage && (
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #dbeafe',
              color: '#1e40af',
              borderRadius: '9px',
              padding: '0.45rem 0.75rem',
              marginBottom: '0.7rem',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{infoMessage}</span>
            </div>
          )}
        </div>

        {/* Middle Section: Active Form with Flex Fill */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.22rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g., rahul@ample.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.52rem 0.85rem 0.52rem 2.25rem',
                      borderRadius: '9px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.86rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.22rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Demo Credentials: Use admin@ample.com / demo or rahul@ample.com / demo.')}
                    style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: 'var(--navy-primary, #244092)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Forgot?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter account password (or demo)"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.52rem 2.25rem 0.52rem 2.25rem',
                      borderRadius: '9px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.86rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{
                      position: 'absolute',
                      right: '0.8rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted, #64748b)',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.05rem' }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="rememberMe" style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #475569)', cursor: 'pointer' }}>
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
                  padding: '0.65rem',
                  fontSize: '0.88rem',
                  marginTop: '0.4rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Verifying Credentials...' : 'Sign In to Ample LMS'}
                {!isLoading && <ArrowRight size={15} />}
              </button>
            </form>
          )}

          {/* TAB 2: CREATE ACCOUNT */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.18rem' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={14} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g., Varun Reddy"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.48rem 0.8rem 0.48rem 2.2rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.18rem' }}>
                  Work or University Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="e.g., yourname@domain.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.48rem 0.8rem 0.48rem 2.2rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.18rem' }}>
                    Campus Location
                  </label>
                  <select
                    value={signUpCampus}
                    onChange={(e) => setSignUpCampus(e.target.value as 'Bengaluru' | 'Hyderabad')}
                    style={{
                      width: '100%',
                      padding: '0.48rem 0.55rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.18rem' }}>
                    Target Discipline
                  </label>
                  <select
                    value={signUpTrack}
                    onChange={(e) => setSignUpTrack(e.target.value as 'VLSI' | 'Embedded Systems' | 'AIML')}
                    style={{
                      width: '100%',
                      padding: '0.48rem 0.55rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="VLSI">VLSI</option>
                    <option value="Embedded Systems">Embedded Systems</option>
                    <option value="AIML">AIML</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.18rem' }}>
                  Set Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.48rem 2.2rem 0.48rem 2.2rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted, #64748b)',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
                  padding: '0.62rem',
                  fontSize: '0.86rem',
                  marginTop: '0.25rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Sending Brevo Code...' : 'Create Account & Send Code'}
                {!isLoading && <ArrowRight size={15} />}
              </button>
            </form>
          )}

          {/* TAB 3: VERIFY EMAIL (6-DIGIT CODE) */}
          {activeTab === 'verify' && (
            <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'center' }}>
              <div style={{
                background: 'var(--bg-secondary, #f8fafc)',
                border: '2px dashed var(--navy-primary, #244092)',
                borderRadius: '12px',
                padding: '0.9rem 1rem'
              }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--navy-primary, #244092)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                  Enter 6-Digit Brevo Verification Code
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{
                    width: '100%',
                    maxWidth: '220px',
                    textAlign: 'center',
                    fontSize: '1.65rem',
                    fontWeight: 800,
                    letterSpacing: '8px',
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--navy-dark, #0f214a)',
                    border: '1px solid var(--border-strong, #cbd5e1)',
                    borderRadius: '8px',
                    padding: '0.35rem 0.5rem',
                    outline: 'none',
                    margin: '0 auto',
                    display: 'block',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length < 6}
                className="ample-btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.65rem',
                  fontSize: '0.88rem',
                  cursor: isLoading || verificationCode.length < 6 ? 'not-allowed' : 'pointer',
                  opacity: verificationCode.length < 6 ? 0.75 : 1
                }}
              >
                {isLoading ? 'Verifying Code...' : 'Verify Email & Complete Registration'}
                {!isLoading && <ArrowRight size={15} />}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem', fontSize: '0.78rem' }}>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--navy-primary, #244092)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: 0
                  }}
                >
                  <RotateCw size={12} />
                  Resend code
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setErrorMessage(''); setInfoMessage(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, #64748b)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Section: Verified Guarantee Badge */}
        <div style={{
          paddingTop: '0.6rem',
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted, #64748b)'
        }}>
          <ShieldCheck size={13} color="#233a78" />
          <span>Ample Semiconductors Academy • Verified Industry Credentials</span>
        </div>
      </div>
    </div>
  );
};

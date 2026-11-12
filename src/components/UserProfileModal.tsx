import React, { useState } from 'react';
import {
  X, User as UserIcon, Cpu, ShieldCheck,
  Github, Linkedin,
  Check, Save, LogOut, RefreshCw
} from 'lucide-react';
import { AmpleLMSLogo } from './AmpleLMSLogo';
import { updateUserProfile, switchDemoUser, logoutUser } from '../api/client';
import type { User, Course } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  user: User;
  courses: Course[];
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onSignOut: () => void;
  onOpenDashboard: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  user,
  courses,
  onClose,
  onUpdateUser,
  onSignOut,
  onOpenDashboard
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'certification' | 'enrolled'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [name, setName] = useState(user.name);
  const [campus, setCampus] = useState(user.campus || 'Bengaluru Innovation HQ');
  const [targetTrack, setTargetTrack] = useState(user.targetTrack || 'VLSI Physical Design & STA');
  const [bio, setBio] = useState(user.bio || '');
  const [githubUrl, setGithubUrl] = useState(user.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl || '');

  // Keep state synced when user prop updates
  React.useEffect(() => {
    setName(user.name);
    setCampus(user.campus || 'Bengaluru Innovation HQ');
    setTargetTrack(user.targetTrack || 'VLSI Physical Design & STA');
    setBio(user.bio || '');
    setGithubUrl(user.githubUrl || '');
    setLinkedinUrl(user.linkedinUrl || '');
  }, [user]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await updateUserProfile({
        id: user.id,
        name,
        campus,
        targetTrack,
        bio,
        githubUrl,
        linkedinUrl
      });
      onUpdateUser(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchDemoRole = async () => {
    const nextRole = user.role === 'admin' ? 'trainee' : 'admin';
    const switched = await switchDemoUser(nextRole);
    onUpdateUser(switched);
  };

  const enrolledCourseObjects = courses.filter(c =>
    (user.enrolledCourseIds || []).includes(c.id)
  );

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
          maxWidth: '740px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          position: 'relative'
        }}
      >
        {/* Top Decorative Banner */}
        <div style={{
          backgroundColor: 'var(--navy-primary, #244092)',
          padding: '1.75rem 2rem 1.25rem',
          color: '#ffffff',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <AmpleLMSLogo variant="horizontal" size="sm" showSubtitle={false} />
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              AMPL-ID: {user.id}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              color: 'var(--navy-primary, #244092)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              border: '2px solid rgba(255,255,255,0.8)'
            }}>
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
                  {user.name}
                </h3>
                <span style={{
                  backgroundColor: user.role === 'admin' ? '#fef3c7' : '#e0f2fe',
                  color: user.role === 'admin' ? '#b45309' : '#0369a1',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px',
                  textTransform: 'uppercase'
                }}>
                  {user.role === 'admin' ? 'Director / Admin' : 'Silicon Trainee'}
                </span>
                <span style={{
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <ShieldCheck size={11} />
                  Level 2 Certified
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '0.25rem' }}>
                {user.email} • {user.campus}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs inside modal */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          padding: '0.5rem 1.5rem 0',
          gap: '0.5rem',
          backgroundColor: '#ffffff'
        }}>
          {[
            { id: 'profile', label: 'Profile Details', icon: UserIcon },
            { id: 'certification', label: 'Certification & Metrics', icon: ShieldCheck },
            { id: 'enrolled', label: `Enrolled Tracks (${enrolledCourseObjects.length})`, icon: Cpu }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.75rem 1rem',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--navy-primary, #244092)' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === tab.id ? 'var(--navy-primary, #244092)' : 'var(--text-muted, #64748b)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem 2rem' }}>
          {/* TAB 1: EDIT PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.88rem',
                      backgroundColor: 'var(--bg-secondary, #f8fafc)',
                      color: 'var(--text-muted, #64748b)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                    Campus Location
                  </label>
                  <select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="Bengaluru Innovation HQ">Bengaluru Innovation HQ</option>
                    <option value="Hyderabad Innovation Lab">Hyderabad Innovation Lab</option>
                    <option value="Virtual Engineering Hub">Virtual Engineering Hub</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                    Primary Specialization Track
                  </label>
                  <select
                    value={targetTrack}
                    onChange={(e) => setTargetTrack(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="VLSI Physical Design & STA">VLSI Physical Design & STA</option>
                    <option value="SystemVerilog & UVM Verification">SystemVerilog & UVM Verification</option>
                    <option value="Embedded Linux & RTOS">Embedded Linux & RTOS</option>
                    <option value="TinyML & Edge AI Silicon">TinyML & Edge AI Silicon</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                  Engineering Background & Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summarize your semiconductor interests, tapeouts, or research..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                    GitHub Profile
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Github size={15} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem 0.65rem 2.3rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle, #e2e8f0)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', display: 'block', marginBottom: '0.35rem' }}>
                    LinkedIn Profile
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Linkedin size={15} color="var(--text-muted, #64748b)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem 0.65rem 2.3rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle, #e2e8f0)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle, #e2e8f0)',
                marginTop: '0.5rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleSwitchDemoRole}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--bg-secondary, #f8fafc)',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary, #475569)',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={13} />
                    Switch to {user.role === 'admin' ? 'Trainee' : 'Admin'} View
                  </button>

                  <button
                    type="button"
                    onClick={() => { logoutUser(); onSignOut(); onClose(); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '9999px',
                      backgroundColor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#e11d48',
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {saveSuccess && (
                    <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Check size={14} /> Profile Saved!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="ample-btn-primary"
                    style={{ padding: '0.55rem 1.35rem', fontSize: '0.88rem' }}
                  >
                    <Save size={15} />
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: CERTIFICATION & CREDENTIALS */}
          {activeTab === 'certification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                backgroundColor: 'var(--bg-secondary, #f8fafc)',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>CERTIFICATION STATUS</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                    Level 2 Certified
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>COURSE STUDY HOURS</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-primary, #244092)', marginTop: '0.2rem' }}>
                    {user.labHours || 28.5} hrs
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>LEARNING STREAK</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ea580c', marginTop: '0.2rem' }}>
                    {user.streakDays || 12} Days 🔥
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>TOP SCORE</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-dark, #0f214a)', marginTop: '0.2rem' }}>
                    {user.topScore || 98}%
                  </div>
                </div>
              </div>

              {/* Verified Credential Card Visual */}
              <div style={{
                backgroundColor: '#0a192f',
                borderRadius: '16px',
                padding: '1.5rem',
                color: '#ffffff',
                border: '1px solid #1e3a8a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700 }}>
                    <ShieldCheck size={16} />
                    AMPLE VERIFIED ENGINEERING CERTIFICATE
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.35rem' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Track: {user.targetTrack} • SkyWater 130nm Sign-off Clean
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    onClick={() => { onClose(); onOpenDashboard(); }}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '9999px',
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    View in Student Portal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENROLLED TRACKS */}
          {activeTab === 'enrolled' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {enrolledCourseObjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted, #64748b)' }}>
                  No enrolled tracks found. Browse the course catalog to enroll!
                </div>
              ) : (
                enrolledCourseObjects.map(course => (
                  <div
                    key={course.id}
                    style={{
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      borderRadius: '12px',
                      padding: '1.1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'var(--bg-secondary, #f8fafc)'
                    }}
                  >
                    <div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--navy-light, #eef2ff)',
                        color: 'var(--navy-primary, #244092)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px'
                      }}>
                        {course.category}
                      </span>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', margin: '0.3rem 0 0.2rem' }}>
                        {course.title}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                        {course.duration} • Target: {course.targetRole}
                      </p>
                    </div>

                    <button
                      onClick={() => { onClose(); onOpenDashboard(); }}
                      className="ample-btn-primary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      Continue Syllabus
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


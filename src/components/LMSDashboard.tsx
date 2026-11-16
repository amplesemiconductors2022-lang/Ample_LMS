import React, { useState, useEffect } from 'react';
import {
  BookOpen, Flame, Play,
  ShieldCheck, MessageSquare, Plus, Send, CheckCircle2,
  Layers, X
} from 'lucide-react';
import type { Course, UserProgress, User } from '../types';
import { fetchMyEnquiries, createEnquiryApi } from '../api/client';
import type { EnquiryRecord } from '../api/client';

interface LMSDashboardProps {
  courses: Course[];
  userProgress: UserProgress;
  currentUser?: User | null;
  onOpenCourse: (course: Course) => void;
}

export const LMSDashboard: React.FC<LMSDashboardProps> = ({
  courses,
  userProgress,
  currentUser,
  onOpenCourse
}) => {
  const enrolledCourses = courses.filter(c => userProgress.enrolledCourseIds.includes(c.id));
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [isOpenAskModal, setIsOpenAskModal] = useState(false);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ask Faculty Form
  const [subject, setSubject] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(enrolledCourses[0]?.title || 'VLSI Physical Design & STA');
  const [message, setMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!currentUser) {
      setEnquiries([]);
      return;
    }
    fetchMyEnquiries()
      .then(data => setEnquiries(data))
      .catch(err => {
        console.warn('Failed to load enquiries:', err);
        setEnquiries([]);
      });
  }, [currentUser]);

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      alert('Please fill out both the subject and your question message.');
      return;
    }

    setIsSubmittingEnquiry(true);
    try {
      const created = await createEnquiryApi({
        subject: subject.trim(),
        track: selectedTrack,
        message: message.trim()
      });

      setEnquiries(prev => [created, ...prev]);
      setIsOpenAskModal(false);
      setSubject('');
      setMessage('');
      showToast('Your technical question has been submitted to Ample faculty mentors!');
    } catch (err: any) {
      console.error('Failed to submit enquiry:', err);
      showToast(err?.message || 'Could not submit inquiry. Please sign in and try again.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '2.5rem 1.5rem' }} className="animate-fade-in">
      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          backgroundColor: 'var(--navy-primary, #244092)',
          color: '#ffffff',
          padding: '0.75rem 1.4rem',
          borderRadius: '9999px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          fontSize: '0.86rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: '20px',
        padding: '2rem 2.25rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{
              backgroundColor: 'var(--navy-light, #eef2ff)',
              color: 'var(--navy-primary, #244092)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              border: '1px solid var(--navy-border, #c7d2fe)'
            }}>
              Ample Silicon Trainee • {currentUser?.campus || 'Bengaluru Innovation HQ'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--navy-dark, #0f214a)', marginBottom: '0.35rem' }}>
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Varun'}!
          </h1>
          <p style={{ color: 'var(--text-secondary, #475569)', fontSize: '0.94rem', maxWidth: '640px' }}>
            You are enrolled in the <strong>{currentUser?.targetTrack || 'ASIC Tapeout & Physical Design Course'}</strong>. Complete your active curriculum modules to prepare for technical interview fast-tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const active = enrolledCourses[0] || courses[0];
              if (active) onOpenCourse(active);
            }}
            className="ample-btn-primary"
          >
            <Play size={16} />
            Resume Active Course
          </button>

          <button
            onClick={() => setIsOpenAskModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#ffffff',
              color: 'var(--navy-primary, #244092)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '9999px',
              padding: '0.65rem 1.15rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare size={16} />
            Ask Faculty Question
          </button>
        </div>
      </div>

      {/* Metrics Row - Clean Academic Metrics (NO hands-on lab time) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem'
      }}>
        {/* Metric 1: Streak */}
        <div className="ample-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>LEARNING STREAK</span>
            <Flame size={18} color="#576488" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#576488' }}>
            {userProgress.streakDays} Days 🔥
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '0.2rem' }}>
            Consistent daily engineering study
          </div>
        </div>

        {/* Metric 2: Completed Lessons */}
        <div className="ample-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>COMPLETED LESSONS</span>
            <BookOpen size={18} color="#233a78" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#233a78' }}>
            {userProgress.completedLessonIds.length} Lessons
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '0.2rem' }}>
            Curriculum theory & architectures finished
          </div>
        </div>

        {/* Metric 3: Assessment Score */}
        <div className="ample-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>ASSESSMENT ACCURACY</span>
            <CheckCircle2 size={18} color="var(--navy-primary, #244092)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy-primary, #244092)' }}>
            {currentUser?.topScore || 98}% Score
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '0.2rem' }}>
            Knowledge checks passed with honors
          </div>
        </div>

        {/* Metric 4: Enrolled Courses */}
        <div className="ample-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>ACTIVE COURSES</span>
            <Layers size={18} color="#5e7ac9" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#5e7ac9' }}>
            {enrolledCourses.length} Enrolled
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '0.2rem' }}>
            Under active study & evaluation
          </div>
        </div>
      </div>

      {/* Main Grid: Enrolled Courses (Left) & Faculty Questions / Enquiries Desk (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem' }}>

        {/* Left Column: Enrolled Courses */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)' }}>
              Your Enrolled Silicon Courses
            </h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--navy-primary, #244092)', fontWeight: 600 }}>
              {enrolledCourses.length} Active Courses
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {enrolledCourses.map((course) => {
              const allLessons = course.modules.flatMap(m => m.lessons);
              const completedCount = allLessons.filter(l => userProgress.completedLessonIds.includes(l.id)).length;
              const progressPct = Math.round((completedCount / (allLessons.length || 1)) * 100);

              return (
                <div
                  key={course.id}
                  className="ample-card"
                  style={{
                    padding: '1.6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{
                          backgroundColor: 'var(--navy-light, #eef2ff)',
                          color: 'var(--navy-primary, #244092)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px'
                        }}>
                          {course.category}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                          {course.duration}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', lineHeight: 1.3 }}>
                        {course.title}
                      </h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-primary, #244092)' }}>
                        {progressPct}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                        {completedCount} of {allLessons.length} Lessons
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--bg-secondary, #f8fafc)',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle, #e2e8f0)'
                  }}>
                    <div style={{
                      width: `${progressPct}%`,
                      height: '100%',
                      backgroundColor: 'var(--navy-primary, #244092)',
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  {/* Instructor Note & Resume Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #475569)' }}>
                        Lead: <strong>{course.instructor.name}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenCourse(course)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: 'var(--navy-light, #eef2ff)',
                        color: 'var(--navy-primary, #244092)',
                        border: '1px solid var(--navy-border, #c7d2fe)',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        padding: '0.5rem 1.1rem',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Play size={14} fill="var(--navy-primary, #244092)" />
                      Continue Lessons
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Student Technical Inquiries & Faculty Mentorship Desk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Inquiries Header Card */}
          <div className="ample-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <MessageSquare size={20} color="var(--navy-primary, #244092)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)' }}>
                  Faculty Mentorship & Inquiries
                </h3>
              </div>
              <button
                onClick={() => setIsOpenAskModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'var(--navy-primary, #244092)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                Ask Question
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #475569)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Ask technical questions about clock tree synthesis, UVM testbenches, or course theory directly to practicing Ample chip architects.
            </p>

            {/* List of Enquiries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {enquiries.length === 0 ? (
                <div style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-secondary, #f8fafc)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  color: 'var(--text-muted, #64748b)',
                  fontSize: '0.85rem'
                }}>
                  You have not submitted any technical inquiries yet. Have questions on your curriculum? Click <strong>Ask Question</strong> above.
                </div>
              ) : (
                enquiries.map((enq) => (
                  <div
                    key={enq.id}
                    style={{
                      padding: '1.1rem',
                      backgroundColor: 'var(--bg-secondary, #f8fafc)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: enq.status === 'resolved' ? '#eff2fa' : enq.status === 'in_progress' ? '#eff6ff' : '#f3f4f7',
                        color: enq.status === 'resolved' ? '#233a78' : enq.status === 'in_progress' ? '#30498f' : '#4a5573',
                        border: `1px solid ${enq.status === 'resolved' ? '#b2c0e9' : enq.status === 'in_progress' ? '#bfdbfe' : '#b6bdd1'}`
                      }}>
                        {enq.status === 'resolved' ? '✓ Answered by Faculty' : enq.status === 'in_progress' ? '● Under Faculty Review' : '⏳ Pending Response'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                        {new Date(enq.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)' }}>
                      {enq.subject}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.45 }}>
                      "{enq.message}"
                    </div>

                    {enq.reply && (
                      <div style={{
                        marginTop: '0.35rem',
                        padding: '0.85rem',
                        backgroundColor: '#ffffff',
                        borderLeft: '3px solid #233a78',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.82rem'
                      }}>
                        <div style={{ fontWeight: 700, color: '#233a78', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle2 size={13} />
                          Faculty Architect Reply:
                        </div>
                        <div style={{ color: 'var(--navy-dark, #0f214a)', lineHeight: 1.45 }}>
                          {enq.reply}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Academic Mentors Availability */}
          <div className="ample-card" style={{ padding: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={18} color="var(--navy-primary, #244092)" />
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)' }}>
                Direct Faculty Office Hours
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #475569)', marginBottom: '0.85rem' }}>
              Need architectural 1-on-1 guidance? R. K. Narayanan and Aditya V. Reddy conduct weekly live cohort reviews every Tuesday & Thursday at 5:00 PM IST.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#233a78', backgroundColor: '#eff2fa', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                Next Session: Thursday 5:00 PM IST
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Ask Question / Submit Enquiry Modal */}
      {isOpenAskModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '540px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={20} color="var(--navy-primary, #244092)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-dark, #0f214a)' }}>
                  Ask Ample Course Faculty
                </h3>
              </div>
              <button
                onClick={() => setIsOpenAskModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEnquiry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', marginBottom: '0.35rem' }}>
                  Related Silicon Course
                </label>
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-strong, #cbd5e1)',
                    fontSize: '0.88rem'
                  }}
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.title}>{c.title}</option>
                  ))}
                  <option value="General Semiconductor Question">General Semiconductor Question</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', marginBottom: '0.35rem' }}>
                  Question Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g., Query regarding CTS skew budget or SDC false path definition"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-strong, #cbd5e1)',
                    fontSize: '0.88rem'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-dark, #0f214a)', marginBottom: '0.35rem' }}>
                  Detailed Question or Technical Query
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the module topic, question, or architectural doubt in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-strong, #cbd5e1)',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsOpenAskModal(false)}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-secondary, #475569)',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEnquiry}
                  className="ample-btn-primary"
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.86rem' }}
                >
                  <Send size={14} />
                  {isSubmittingEnquiry ? 'Submitting...' : 'Submit to Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
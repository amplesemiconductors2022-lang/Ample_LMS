import React, { useState, useEffect } from 'react';
import {
  Users, Cpu, BookOpen, Search,
  CheckCircle2, AlertCircle, Download, Plus,
  ShieldCheck, BarChart3, Sparkles, Building2, Eye, Check, X,
  Edit, Trash2, MessageSquare, Send, ExternalLink
} from 'lucide-react';
import type { Course } from '../types';
import {
  fetchTrainees, updateTraineeStatusApi,
  fetchTapeouts, updateTapeoutStatusApi,
  fetchCohorts, createCohortApi, createCourseApi, updateCourseApi, deleteCourseApi,
  fetchCourses, fetchEnquiries, replyEnquiryApi, updateEnquiryStatusApi, deleteEnquiryApi
} from '../api/client';
import type { TraineeRecord, TapeoutRecord, CohortRecord, EnquiryRecord } from '../api/client';

interface AdminPortalProps {
  courses?: Course[];
  onNavigate?: (view: 'landing' | 'catalog' | 'dashboard' | 'admin') => void;
  onAddCourse?: (course: Course) => void;
  onUpdateCourse?: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  courses = [],
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trainees' | 'tapeouts' | 'courses' | 'cohorts' | 'enquiries'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState('All');
  const [enquiryFilter, setEnquiryFilter] = useState<'All' | 'pending' | 'in_progress' | 'resolved'>('All');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  // Backend state
  const [trainees, setTrainees] = useState<TraineeRecord[]>([]);
  const [tapeouts, setTapeouts] = useState<TapeoutRecord[]>([]);
  const [cohorts, setCohorts] = useState<CohortRecord[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [localCourses, setLocalCourses] = useState<Course[]>(courses && courses.length > 0 ? courses : []);
  const [, setIsLoading] = useState(true);

  // Friendly toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Sync courses prop with local courses
  useEffect(() => {
    if (courses && courses.length > 0) {
      setLocalCourses(courses);
    }
  }, [courses]);

  // Modals state
  const [isOpenTrackModal, setIsOpenTrackModal] = useState(false);
  const [isOpenCohortModal, setIsOpenCohortModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [inspectingTapeout, setInspectingTapeout] = useState<TapeoutRecord | null>(null);

  // Track Form state
  const [trackForm, setTrackForm] = useState({
    title: '',
    category: 'VLSI' as 'VLSI' | 'Embedded' | 'AI/ML',
    duration: '12 Weeks (90 hrs)',
    targetRole: 'Physical Design Engineer',
    instructorName: 'Dr. Sameer Joshi',
    instructorTitle: 'Principal Hardware Architect',
    description: '',
    toolsLearned: 'Verilator, OpenROAD, PrimeTime, SkyWater 130nm',
    initialLessonTitle: 'Introduction to Modern Silicon Architecture',
    sampleCode: `// Synthesizable RTL Definition\nmodule custom_ip_core (\n    input clk,\n    input rst_n,\n    output [7:0] data_out\n);\n    // Implementation\nendmodule`
  });

  // Cohort Form state
  const [cohortForm, setCohortForm] = useState({
    name: 'Bengaluru Spring 2026 ASIC Cohort',
    campus: 'Bengaluru Innovation HQ',
    track: 'VLSI Physical Design & STA',
    startDate: '2026-12-01',
    seatLimit: 30,
    mentor: 'R. K. Narayanan (Ample)'
  });

  // Load initial backend data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [traineesData, tapeoutsData, cohortsData, enquiriesData] = await Promise.all([
          fetchTrainees(),
          fetchTapeouts(),
          fetchCohorts(),
          fetchEnquiries()
        ]);
        setTrainees(traineesData);
        setTapeouts(tapeoutsData);
        setCohorts(cohortsData);
        setEnquiries(enquiriesData);

        // Also fetch courses if not passed via props
        if (!courses || courses.length === 0) {
          const coursesData = await fetchCourses();
          if (coursesData && coursesData.length > 0) {
            setLocalCourses(coursesData);
          }
        }
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Handlers
  const handleSendReply = async (enquiryId: string) => {
    const text = replyTextMap[enquiryId]?.trim();
    if (!text) return;

    try {
      const updated = await replyEnquiryApi(enquiryId, text, 'resolved');
      setEnquiries(prev => prev.map(e => e.id === enquiryId ? updated : e));
      setReplyTextMap(prev => ({ ...prev, [enquiryId]: '' }));
      showToast('Faculty reply sent to student and marked as Resolved!', 'success');
    } catch (err) {
      console.error('Failed to send reply:', err);
      showToast('Could not send reply. Please try again.', 'error');
    }
  };

  const handleStatusChange = async (enquiryId: string, status: 'pending' | 'in_progress' | 'resolved') => {
    try {
      await updateEnquiryStatusApi(enquiryId, status);
      setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, status } : e));
      showToast(`Enquiry status updated to ${status}.`, 'info');
    } catch (err) {
      console.error('Failed to update enquiry status:', err);
    }
  };

  const handleDeleteEnquiry = async (enquiryId: string) => {
    if (!confirm('Are you sure you want to remove this enquiry?')) return;
    try {
      await deleteEnquiryApi(enquiryId);
      setEnquiries(prev => prev.filter(e => e.id !== enquiryId));
      showToast('Enquiry successfully removed.', 'info');
    } catch (err) {
      console.error('Failed to delete enquiry:', err);
    }
  };

  const handleFastTrack = async (traineeId: string) => {
    await updateTraineeStatusApi(traineeId, 'referred');
    setTrainees(prev => prev.map(t => t.id === traineeId ? { ...t, interviewStatus: 'referred' } : t));
    showToast('Candidate fast-tracked to Ample Bengaluru & Hyderabad recruiting managers!', 'success');
  };

  const handleApproveTapeout = async (tapeoutId: string) => {
    await updateTapeoutStatusApi(tapeoutId, 'Approved');
    setTapeouts(prev => prev.map(t => t.id === tapeoutId ? { ...t, status: 'Approved' } : t));
    if (inspectingTapeout && inspectingTapeout.id === tapeoutId) {
      setInspectingTapeout({ ...inspectingTapeout, status: 'Approved' });
    }
    showToast('Tapeout approved! Tapeout Certification issued to the candidate.', 'success');
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Course', 'Progress(%)', 'Lab Hours', 'Streak(Days)', 'Certification Status', 'Interview Status', 'Score(%)'];
    const rows = trainees.map(t => [
      t.id,
      `"${t.name}"`,
      t.email,
      `"${t.track}"`,
      t.progress,
      t.labHours,
      t.streak,
      `"${t.passportLevel}"`,
      t.interviewStatus,
      t.topScore
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ample_semiconductors_talent_pipeline_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Talent pipeline CSV exported successfully!', 'success');
  };

  const handleCreateTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackForm.title.trim() || !trackForm.description.trim()) {
      showToast('Please provide a course title and description.', 'error');
      return;
    }

    const newCourse: Course = {
      id: 'course-' + Date.now(),
      title: trackForm.title.trim(),
      slug: trackForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: trackForm.category,
      duration: trackForm.duration,
      lessonsCount: 18,
      rating: 5.0,
      reviewsCount: 1,
      instructor: {
        name: trackForm.instructorName || 'Dr. Sameer Joshi',
        title: trackForm.instructorTitle || 'Principal Hardware Architect',
        avatar: '/assets/img/team.jpg',
        company: 'Ample Semiconductors'
      },
      thumbnail: trackForm.category === 'VLSI' ? '/assets/img/service-vlsi.jpg' : trackForm.category === 'Embedded' ? '/assets/img/embedded.jpg' : '/assets/img/service-ai-ml.jpg',
      tagline: trackForm.title + ' for Production Silicon Tapeouts',
      description: trackForm.description,
      targetRole: trackForm.targetRole,
      toolsLearned: trackForm.toolsLearned.split(',').map(s => s.trim()).filter(Boolean),
      enrolledCount: 0,
      sampleLabCode: trackForm.sampleCode,
      modules: [
        {
          id: 'mod-' + Date.now(),
          title: 'Module 1: Architecture Fundamentals & SDC Specs',
          lessons: [
            {
              id: 'les-' + Date.now(),
              title: trackForm.initialLessonTitle || 'Introduction to Modern Silicon Architecture',
              duration: '45 mins',
              type: 'video',
              completed: false,
              content: {
                summary: 'Core engineering concepts and industrial tapeout methodologies.',
                keyTakeaways: [
                  'Understand architectural specifications and microarchitecture partitioning.',
                  'Meeting stringent Power, Performance, and Area (PPA) goals.'
                ],
                theoryText: trackForm.description
              }
            }
          ]
        }
      ]
    };

    const saved = await createCourseApi(newCourse);
    setLocalCourses(prev => [saved, ...prev.filter(c => c.id !== saved.id)]);
    if (onAddCourse) {
      onAddCourse(saved);
    }
    setIsOpenTrackModal(false);
    setTrackForm({
      title: '',
      category: 'VLSI',
      duration: '12 Weeks (90 hrs)',
      targetRole: 'Physical Design Engineer',
      instructorName: 'Dr. Sameer Joshi',
      instructorTitle: 'Principal Hardware Architect',
      description: '',
      toolsLearned: 'Verilator, OpenROAD, PrimeTime, SkyWater 130nm',
      initialLessonTitle: 'Introduction to Modern Silicon Architecture',
      sampleCode: `// Synthesizable RTL Definition\nmodule custom_ip_core (\n    input clk,\n    input rst_n,\n    output [7:0] data_out\n);\n    // Implementation\nendmodule`
    });
    showToast(`Course "${saved.title}" published successfully live across Ample Learn!`, 'success');
  };

  const handleCreateCohortSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createCohortApi({
      name: cohortForm.name,
      campus: cohortForm.campus,
      track: cohortForm.track,
      startDate: cohortForm.startDate,
      seatLimit: Number(cohortForm.seatLimit),
      mentor: cohortForm.mentor
    });
    setCohorts(prev => [created, ...prev.filter(c => c.id !== created.id)]);
    setIsOpenCohortModal(false);
    showToast(`Cohort "${created.name}" created for ${created.campus}!`, 'success');
  };

  const handleUpdateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    const updated = await updateCourseApi(editingCourse.id, editingCourse);
    const result = updated || editingCourse;
    setLocalCourses(prev => prev.map(c => c.id === result.id ? result : c));
    if (onUpdateCourse) {
      onUpdateCourse(result);
    }
    setEditingCourse(null);
    showToast(`Updated syllabus for "${result.title}"!`, 'success');
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete course "${title}"?`)) {
      await deleteCourseApi(id);
      setLocalCourses(prev => prev.filter(c => c.id !== id));
      if (onDeleteCourse) {
        onDeleteCourse(id);
      }
      showToast(`Course "${title}" removed from catalog.`, 'info');
    }
  };

  const filteredTrainees = trainees.filter(t => {
    const matchesTrack = trackFilter === 'All' || t.track.includes(trackFilter);
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.track.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTrack && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '2.5rem 1.5rem', position: 'relative' }} className="animate-fade-in">
      {/* Friendly Floating Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          backgroundColor: toast.type === 'error' ? '#8b93a8' : toast.type === 'info' ? 'var(--navy-primary)' : '#233a78',
          color: '#ffffff',
          padding: '0.75rem 1.4rem',
          borderRadius: '9999px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
          fontSize: '0.88rem',
          fontWeight: 600,
          animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {toast.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              marginLeft: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Admin Top Header */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
        borderRadius: '20px',
        padding: '1.75rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{
              backgroundColor: 'var(--navy-light)',
              color: 'var(--navy-primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              border: '1px solid var(--navy-border)'
            }}>
              Ample Administration Console
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Bengaluru HQ • Hyderabad Center
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy-dark)', marginBottom: '0.2rem' }}>
            Ample Learn Management & Talent Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Full control over silicon curriculums, campus batches, GDSII tapeouts, and direct engineer placement into Ample teams.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.open('#landing', '_blank')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'var(--navy-light)',
              color: 'var(--navy-primary)',
              border: '1px solid var(--navy-border)',
              padding: '0.65rem 1.15rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ExternalLink size={15} />
            View Live Website
          </button>

          <button
            onClick={() => setIsOpenTrackModal(true)}
            className="ample-btn-primary"
          >
            <Plus size={16} />
            Add New Course
          </button>

          <button
            onClick={() => setIsOpenCohortModal(true)}
            className="ample-btn-secondary"
          >
            <Building2 size={16} />
            Create Campus Batch
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              padding: '0.65rem 1.1rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div className="ample-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE TRAINEES</span>
            <Users size={18} color="var(--navy-primary)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--navy-dark)' }}>
            {trainees.length > 0 ? trainees.length * 568 : 2842}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#233a78', marginTop: '0.2rem', fontWeight: 600 }}>
            ↑ 14% enrollment growth
          </div>
        </div>

        <div className="ample-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>STUDENT INQUIRIES</span>
            <MessageSquare size={18} color="#576488" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#576488' }}>
            {enquiries.filter(e => e.status === 'pending').length} Questions
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Awaiting faculty answers
          </div>
        </div>

        <div className="ample-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TAPE-OUTS VERIFIED</span>
            <Cpu size={18} color="#233a78" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#233a78' }}>
            {tapeouts.filter(t => t.status === 'Approved').length + 15} Designs
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            SkyWater 130nm & FreePDK45
          </div>
        </div>

        <div className="ample-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE COURSES</span>
            <BookOpen size={18} color="var(--navy-primary)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--navy-primary)' }}>
            {localCourses.length} Curriculums
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            VLSI, Embedded & Edge AI
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        marginBottom: '1.75rem',
        backgroundColor: 'var(--bg-secondary)',
        padding: '0.3rem',
        borderRadius: '9999px',
        width: 'fit-content',
        border: '1px solid var(--border-subtle)',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'overview', label: 'Overview & Insights', icon: BarChart3 },
          { id: 'enquiries', label: `Student Inquiries (${enquiries.length})`, icon: MessageSquare },
          { id: 'courses', label: `Curriculums & Courses (${localCourses.length})`, icon: BookOpen },
          { id: 'trainees', label: `Trainee Roster (${trainees.length})`, icon: Users },
          { id: 'tapeouts', label: `Tapeout Approvals (${tapeouts.length})`, icon: Cpu },
          { id: 'cohorts', label: `Campus Batches (${cohorts.length})`, icon: Building2 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#ffffff' : 'transparent',
              color: activeTab === tab.id ? 'var(--navy-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: activeTab === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {/* Recent Fast-Track Candidates */}
          <div className="ample-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.12rem', fontWeight: 700, color: 'var(--navy-dark)' }}>
                  Top Interview-Ready Candidates
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Engineers with verified certifications & &gt;90% course completion
                </p>
              </div>
              <Sparkles size={18} color="var(--navy-primary)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {trainees.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-dark)' }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {t.track} • {t.labHours} Lab Hrs • Score: <strong style={{ color: '#233a78' }}>{t.topScore}%</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      backgroundColor: t.interviewStatus === 'hired' ? '#eff2fa' : 'var(--navy-light)',
                      color: t.interviewStatus === 'hired' ? '#233a78' : 'var(--navy-primary)',
                      border: `1px solid ${t.interviewStatus === 'hired' ? '#b2c0e9' : 'var(--navy-border)'}`
                    }}>
                      {t.interviewStatus.toUpperCase()}
                    </span>
                    {t.interviewStatus !== 'referred' && t.interviewStatus !== 'hired' && (
                      <button
                        onClick={() => handleFastTrack(t.id)}
                        style={{
                          backgroundColor: 'var(--navy-primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '9999px',
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Refer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Curriculum & Track Telemetry */}
          <div className="ample-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.12rem', fontWeight: 700, color: 'var(--navy-dark)' }}>
                  Curriculum & Course Telemetry
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Active cohort progress & verification completion
                </p>
              </div>
              <Cpu size={18} color="#233a78" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.86rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Curriculum Module Completion Rate</span>
                  <strong style={{ color: 'var(--navy-primary)' }}>78% (Healthy)</strong>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: '78%', height: '100%', backgroundColor: 'var(--navy-primary)', borderRadius: '9999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Certification Sign-off Queue</span>
                  <strong style={{ color: '#233a78' }}>3 Trainees Pending</strong>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: '28%', height: '100%', backgroundColor: '#233a78', borderRadius: '9999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Talent Evaluation Platform Health</span>
                  <strong style={{ color: '#233a78' }}>99.9% Uptime</strong>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: '99%', height: '100%', backgroundColor: '#233a78', borderRadius: '9999px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRAINEES ROSTER */}
      {activeTab === 'trainees' && (
        <div className="ample-card" style={{ padding: '1.75rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search trainees by name, email, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.4rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-subtle)',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['All', 'VLSI', 'Verification', 'Embedded', 'TinyML'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTrackFilter(filter)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: trackFilter === filter ? 700 : 500,
                    borderRadius: '9999px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: trackFilter === filter ? 'var(--navy-light)' : '#ffffff',
                    color: trackFilter === filter ? 'var(--navy-primary)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Trainee Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Course & Progress</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Lab Hours</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Certification</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Interview Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainees.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--navy-dark)' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.track}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.progress}% Completed</div>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy-primary)' }}>
                      {t.labHours} hrs
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        backgroundColor: '#eff2fa',
                        color: '#233a78',
                        border: '1px solid #b2c0e9'
                      }}>
                        <ShieldCheck size={12} />
                        {t.passportLevel}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        backgroundColor: t.interviewStatus === 'hired' ? '#eff2fa' : t.interviewStatus === 'referred' ? '#f3f4f7' : 'var(--navy-light)',
                        color: t.interviewStatus === 'hired' ? '#233a78' : t.interviewStatus === 'referred' ? '#576488' : 'var(--navy-primary)'
                      }}>
                        {t.interviewStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {t.interviewStatus !== 'referred' && t.interviewStatus !== 'hired' ? (
                        <button
                          onClick={() => handleFastTrack(t.id)}
                          style={{
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            borderRadius: '9999px',
                            backgroundColor: 'var(--navy-primary)',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Fast-Track to Interview
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#233a78', fontWeight: 600 }}>
                          ✓ Pipeline Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TAPEOUTS APPROVALS */}
      {activeTab === 'tapeouts' && (
        <div className="ample-card" style={{ padding: '1.75rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-dark)' }}>
              SkyWater 130nm Virtual Tapeout Approvals Queue
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Inspect physical DRC/LVS clean layouts, review multi-corner timing reports, and issue tapeout certifications.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tapeouts.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#ffffff', color: 'var(--navy-primary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700, border: '1px solid var(--border-subtle)' }}>
                      {item.id}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--navy-dark)' }}>{item.project}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>by {item.candidate}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span>PDK: <strong>{item.pdk}</strong></span>
                    <span>Area: <strong>{item.coreArea}</strong></span>
                    <span>STA Slack: <strong style={{ color: item.staSlack.includes('MET') ? '#233a78' : '#6f7993' }}>{item.staSlack}</strong></span>
                    <span>DRC: <strong style={{ color: '#233a78' }}>{item.drcStatus}</strong></span>
                    <span>Status: <strong style={{ color: item.status === 'Approved' ? '#233a78' : '#576488' }}>{item.status}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button
                    onClick={() => setInspectingTapeout(item)}
                    className="ample-btn-secondary"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
                  >
                    <Eye size={14} />
                    Inspect Layout & Report
                  </button>

                  {item.status !== 'Approved' && (
                    <button
                      onClick={() => handleApproveTapeout(item.id)}
                      className="ample-btn-primary"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                    >
                      <Check size={14} />
                      Approve Tapeout
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: COURSES & CURRICULUMS */}
      {activeTab === 'courses' && (
        <div className="ample-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-dark)' }}>
                Active Curriculums & Silicon Courses ({localCourses.length})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Create, edit, and update engineering syllabi in real time across the platform.
              </p>
            </div>
            <button
              onClick={() => setIsOpenTrackModal(true)}
              className="ample-btn-primary"
            >
              <Plus size={15} />
              Add New Course
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {localCourses.map((course) => (
              <div
                key={course.id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'var(--navy-light)', color: 'var(--navy-primary)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                      {course.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {course.duration}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy-dark)', marginBottom: '0.35rem' }}>
                    {course.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineClamp: 2 }}>
                    Role: {course.targetRole}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {course.modules.length} Modules • {course.enrolledCount} Trainees
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setEditingCourse(course)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontSize: '0.78rem',
                        color: 'var(--navy-primary)',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '0.3rem 0.6rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontSize: '0.78rem',
                        color: '#6f7993',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '0.3rem 0.6rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CAMPUS BATCHES (COHORTS) */}
      {activeTab === 'cohorts' && (
        <div className="ample-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-dark)' }}>
                Ample Campus Batches & Corporate Cohorts ({cohorts.length})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Bengaluru HQ and Hyderabad Innovation Center cohorts.
              </p>
            </div>
            <button
              onClick={() => setIsOpenCohortModal(true)}
              className="ample-btn-primary"
            >
              <Plus size={15} />
              Create Campus Batch
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {cohorts.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '1.4rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-primary)', backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', padding: '0.15rem 0.6rem', borderRadius: '9999px' }}>
                    {c.campus}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Starts: {c.startDate}
                  </span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-dark)', margin: '0.5rem 0 0.35rem' }}>
                  {c.name}
                </h4>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Course: <strong>{c.track}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Lead Mentor: {c.mentor}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Capacity:</span>
                  <strong style={{ color: '#233a78' }}>{c.enrolledCount} / {c.seatLimit} Seats Filled</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: STUDENT TECHNICAL ENQUIRIES & QUESTIONS */}
      {activeTab === 'enquiries' && (
        <div className="ample-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-dark)' }}>
                Student Technical Inquiries & Mentorship Queue ({enquiries.length})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Review questions submitted by silicon trainees across campuses and provide official faculty guidance.
              </p>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {(['All', 'pending', 'in_progress', 'resolved'] as const).map(status => {
                const count = status === 'All' ? enquiries.length : enquiries.filter(e => e.status === status).length;
                const label = status === 'All' ? 'All' : status === 'pending' ? 'Pending' : status === 'in_progress' ? 'In Review' : 'Resolved';
                return (
                  <button
                    key={status}
                    onClick={() => setEnquiryFilter(status)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: enquiryFilter === status ? 700 : 500,
                      borderRadius: '9999px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: enquiryFilter === status ? 'var(--navy-light)' : '#ffffff',
                      color: enquiryFilter === status ? 'var(--navy-primary)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {enquiries
              .filter(e => enquiryFilter === 'All' || e.status === enquiryFilter)
              .length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No student inquiries found in this filter view.
              </div>
            ) : (
              enquiries
                .filter(e => enquiryFilter === 'All' || e.status === enquiryFilter)
                .map((enq) => (
                  <div
                    key={enq.id}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--navy-dark)' }}>
                            {enq.studentName}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            &lt;{enq.studentEmail}&gt;
                          </span>
                          {enq.studentCampus && (
                            <span style={{ fontSize: '0.72rem', backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', padding: '0.1rem 0.5rem', borderRadius: '9999px', color: 'var(--navy-primary)', fontWeight: 600 }}>
                              {enq.studentCampus}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Course: <strong style={{ color: 'var(--navy-primary)' }}>{enq.track || 'General Silicon Question'}</strong> • Submitted: {new Date(enq.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={enq.status}
                          onChange={(e) => handleStatusChange(enq.id, e.target.value as any)}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '0.3rem 0.65rem',
                            borderRadius: '9999px',
                            border: '1px solid var(--border-strong)',
                            backgroundColor: enq.status === 'resolved' ? '#eff2fa' : enq.status === 'in_progress' ? '#eff6ff' : '#f3f4f7',
                            color: enq.status === 'resolved' ? '#233a78' : enq.status === 'in_progress' ? '#30498f' : '#4a5573',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pending">⏳ Pending Response</option>
                          <option value="in_progress">● In Review</option>
                          <option value="resolved">✓ Resolved</option>
                        </select>

                        <button
                          onClick={() => handleDeleteEnquiry(enq.id)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
                          title="Delete Enquiry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Question Details */}
                    <div style={{ backgroundColor: '#ffffff', padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--navy-dark)', marginBottom: '0.35rem' }}>
                        Subject: {enq.subject}
                      </div>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        "{enq.message}"
                      </p>
                    </div>

                    {/* Official Faculty Reply (if present) */}
                    {enq.reply && (
                      <div style={{ backgroundColor: '#eff2fa', borderLeft: '4px solid #233a78', padding: '0.85rem 1.1rem', borderRadius: '0 10px 10px 0' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#233a78', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Check size={14} />
                          Faculty Architect Response {enq.repliedAt ? `• ${new Date(enq.repliedAt).toLocaleDateString()}` : ''}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--navy-dark)', lineHeight: 1.5 }}>
                          {enq.reply}
                        </div>
                      </div>
                    )}

                    {/* Reply Input Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Type faculty response to student..."
                          value={replyTextMap[enq.id] || ''}
                          onChange={(e) => setReplyTextMap(prev => ({ ...prev, [enq.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendReply(enq.id);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.55rem 0.85rem',
                            borderRadius: '10px',
                            border: '1px solid var(--border-strong)',
                            fontSize: '0.85rem'
                          }}
                        />
                        <button
                          onClick={() => handleSendReply(enq.id)}
                          disabled={!replyTextMap[enq.id]?.trim()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.55rem 1.1rem',
                            borderRadius: '9999px',
                            backgroundColor: replyTextMap[enq.id]?.trim() ? 'var(--navy-primary)' : '#94a3b8',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            border: 'none',
                            cursor: replyTextMap[enq.id]?.trim() ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <Send size={13} />
                          Send Reply & Resolve
                        </button>
                      </div>

                      {/* Quick Templates */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick Response Suggestions:</span>
                        {[
                          'CTS skew budget is acceptable within 100ps for SkyWater 130nm.',
                          'Use SEQ_ARB_WEIGHTED priority in your UVM sequencer arbitration.',
                          'Ensure standard cell LEF spacing conforms to manufacturing grid rules.',
                          'This topic will be demonstrated in Tuesday live cohort mentoring.'
                        ].map((tmpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setReplyTextMap(prev => ({ ...prev, [enq.id]: tmpl }))}
                            style={{
                              fontSize: '0.7rem',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '9999px',
                              padding: '0.15rem 0.55rem',
                              color: 'var(--navy-primary)',
                              cursor: 'pointer'
                            }}
                          >
                            + {tmpl.slice(0, 32)}...
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: ADD NEW TRACK BUILDER ================= */}
      {isOpenTrackModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-dark)' }}>
                  Create New Silicon Course
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Publish an industry-grade curriculum into Ample Learn.
                </p>
              </div>
              <button
                onClick={() => setIsOpenTrackModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleCreateTrackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.35rem' }}>
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., RISC-V SoC Microarchitecture & Physical Tapeout"
                  value={trackForm.title}
                  onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    value={trackForm.category}
                    onChange={(e) => setTrackForm({ ...trackForm, category: e.target.value as any })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  >
                    <option value="VLSI">VLSI Design</option>
                    <option value="Embedded">Embedded Systems</option>
                    <option value="AI/ML">AI & ML Silicon</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.35rem' }}>
                    Duration
                  </label>
                  <input
                    type="text"
                    value={trackForm.duration}
                    onChange={(e) => setTrackForm({ ...trackForm, duration: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.35rem' }}>
                    Target Role at Ample
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Physical Design Engineer"
                    value={trackForm.targetRole}
                    onChange={(e) => setTrackForm({ ...trackForm, targetRole: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.35rem' }}>
                    Lead Instructor Name
                  </label>
                  <input
                    type="text"
                    value={trackForm.instructorName}
                    onChange={(e) => setTrackForm({ ...trackForm, instructorName: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.35rem' }}>
                  Description & Silicon Scope *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Master RTL logic, floorplanning, CTS, STA sign-off, and fabrication rules..."
                  value={trackForm.description}
                  onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.35rem' }}>
                  Tools Learned (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="PrimeTime, ICC2, OpenROAD, Verilator"
                  value={trackForm.toolsLearned}
                  onChange={(e) => setTrackForm({ ...trackForm, toolsLearned: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.35rem' }}>
                  Initial Lesson 1 Title
                </label>
                <input
                  type="text"
                  value={trackForm.initialLessonTitle}
                  onChange={(e) => setTrackForm({ ...trackForm, initialLessonTitle: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsOpenTrackModal(false)}
                  className="ample-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ample-btn-primary"
                >
                  Publish Course Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT COURSE MODAL ================= */}
      {editingCourse && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '620px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-dark)' }}>
                Edit Syllabus: {editingCourse.title}
              </h3>
              <button onClick={() => setEditingCourse(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateCourseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingCourse.title}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                    Category
                  </label>
                  <select
                    value={editingCourse.category}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value as any })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  >
                    <option value="VLSI">VLSI Design</option>
                    <option value="Embedded">Embedded Systems</option>
                    <option value="AI/ML">AI & ML Silicon</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                    Duration
                  </label>
                  <input
                    type="text"
                    value={editingCourse.duration}
                    onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={editingCourse.targetRole}
                    onChange={(e) => setEditingCourse({ ...editingCourse, targetRole: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                    Tools Learned (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(editingCourse.toolsLearned) ? editingCourse.toolsLearned.join(', ') : ''}
                    onChange={(e) => setEditingCourse({
                      ...editingCourse,
                      toolsLearned: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                  Description & Syllabus Scope *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditingCourse(null)} className="ample-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="ample-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: CREATE CAMPUS BATCH ================= */}
      {isOpenCohortModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-dark)' }}>
                  Create Campus Batch / Cohort
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Organize structured cohorts for Bengaluru & Hyderabad facilities.
                </p>
              </div>
              <button onClick={() => setIsOpenCohortModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCohortSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                  Batch Name *
                </label>
                <input
                  type="text"
                  required
                  value={cohortForm.name}
                  onChange={(e) => setCohortForm({ ...cohortForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                    Campus Location
                  </label>
                  <select
                    value={cohortForm.campus}
                    onChange={(e) => setCohortForm({ ...cohortForm, campus: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  >
                    <option value="Bengaluru Innovation HQ">Bengaluru Innovation HQ</option>
                    <option value="Hyderabad Innovation Lab">Hyderabad Innovation Lab</option>
                    <option value="Virtual Engineering Hub">Virtual Engineering Hub</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                    Seat Limit
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={cohortForm.seatLimit}
                    onChange={(e) => setCohortForm({ ...cohortForm, seatLimit: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                  Associated Course
                </label>
                <select
                  value={cohortForm.track}
                  onChange={(e) => setCohortForm({ ...cohortForm, track: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                >
                  {localCourses.map(c => (
                    <option key={c.id} value={c.title}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={cohortForm.startDate}
                    onChange={(e) => setCohortForm({ ...cohortForm, startDate: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-dark)', display: 'block', marginBottom: '0.3rem' }}>
                    Lead Mentor
                  </label>
                  <input
                    type="text"
                    value={cohortForm.mentor}
                    onChange={(e) => setCohortForm({ ...cohortForm, mentor: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsOpenCohortModal(false)} className="ample-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="ample-btn-primary">
                  Launch Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: INSPECT TAPEOUT LAYOUT ================= */}
      {inspectingTapeout && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '720px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--navy-light)', color: 'var(--navy-primary)', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '4px' }}>
                  {inspectingTapeout.id}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-dark)', marginTop: '0.25rem' }}>
                  {inspectingTapeout.project}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Submitted by {inspectingTapeout.candidate} • {inspectingTapeout.submissionDate}
                </div>
              </div>
              <button onClick={() => setInspectingTapeout(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Tapeout Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PDK Target</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy-dark)' }}>{inspectingTapeout.pdk}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Core Area</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy-dark)' }}>{inspectingTapeout.coreArea}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>STA Sign-off Slack</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: inspectingTapeout.staSlack.includes('MET') ? '#233a78' : '#6f7993' }}>
                  {inspectingTapeout.staSlack}
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Physical DRC</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#233a78' }}>{inspectingTapeout.drcStatus}</div>
              </div>
            </div>

            {/* Visual Chip Representation */}
            <div style={{
              backgroundColor: '#0a192f',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              border: '1px solid #213262'
            }}>
              <div style={{ fontSize: '0.78rem', color: '#5f7cca', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
                GDSII Hierarchical Cell Layout & Standard Cell Tracks (SkyWater 130nm)
              </div>
              <div style={{
                width: '180px',
                height: '180px',
                border: '2px solid #5a7bd6',
                margin: '0 auto',
                backgroundColor: '#061c38',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(90, 123, 214, 0.2)'
              }}>
                <Cpu size={36} color="#5a7bd6" />
                <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 700, marginTop: '0.4rem' }}>
                  {inspectingTapeout.project.split(' ')[0]}
                </span>
                <span style={{ fontSize: '0.62rem', color: '#2d4b9c' }}>
                  ✔ DRC / LVS MATCHED
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Status: <strong style={{ color: inspectingTapeout.status === 'Approved' ? '#233a78' : '#576488' }}>{inspectingTapeout.status}</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setInspectingTapeout(null)} className="ample-btn-secondary">
                  Close
                </button>
                {inspectingTapeout.status !== 'Approved' && (
                  <button
                    type="button"
                    onClick={() => handleApproveTapeout(inspectingTapeout.id)}
                    className="ample-btn-primary"
                  >
                    <Check size={15} />
                    Approve Tapeout Certification
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

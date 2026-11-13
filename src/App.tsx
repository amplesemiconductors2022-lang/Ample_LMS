import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { CourseCatalog } from './components/CourseCatalog';
import { LMSDashboard } from './components/LMSDashboard';
import { LessonViewer } from './components/LessonViewer';
import { AmplePreloader } from './components/AmplePreloader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { Footer } from './components/Footer';

const AdminPortal = lazy(() => import('./components/AdminPortal').then(m => ({ default: m.AdminPortal })));

type View = 'landing' | 'catalog' | 'dashboard' | 'lesson' | 'admin';
const NAV_VIEWS: View[] = ['landing', 'catalog', 'dashboard', 'admin'];
const viewFromHash = (): View => {
  const h = window.location.hash.replace('#', '') as View;
  return NAV_VIEWS.includes(h) ? h : 'landing';
};
import { COURSES_DATA } from './data/coursesData';
import { fetchCourses, fetchCurrentUser, enrollCourseApi, completeLessonApi } from './api/client';
import type { Course, UserProgress, User } from './types';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const EMPTY_PROGRESS: UserProgress = {
  enrolledCourseIds: [],
  completedLessonIds: [],
  quizScores: {},
  labHours: 0,
  streakDays: 0,
  certificationReady: false
};

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(viewFromHash);
  useEffect(() => {
    const onHash = () => setCurrentView(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ample_current_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && u.name && u.name.includes('Priyanka')) {
          u.name = 'Ample Administrator';
          localStorage.setItem('ample_current_user', JSON.stringify(u));
        }
        return u;
      } catch { }
    }
    return null;
  });

  const [isOpenAuthModal, setIsOpenAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [isOpenProfileModal, setIsOpenProfileModal] = useState(false);

  // Global Toast Feedback State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Dynamic Courses state synced with Backend REST API & LocalStorage
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('ample_courses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { }
    }
    return COURSES_DATA;
  });

  useEffect(() => {
    const rawHash = window.location.hash || '';
    if (rawHash.startsWith('#oauth=')) {
      const token = decodeURIComponent(rawHash.slice('#oauth='.length));
      localStorage.setItem('ample_token', token);
      fetchCurrentUser().then(user => {
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('ample_current_user', JSON.stringify(user));
          showToast(`Welcome, ${user.name}!`, 'success');
          handleNavigate(user.role === 'admin' ? 'admin' : 'dashboard');
        }
      }).catch(() => showToast('OAuth session check failed.', 'error'));
    } else if (rawHash.startsWith('#oauth_error=')) {
      const msg = decodeURIComponent(rawHash.slice('#oauth_error='.length));
      showToast(msg || 'OAuth sign-in failed.', 'error');
      window.location.hash = 'landing';
    }

    fetchCourses().then(data => {
      if (data && data.length > 0) {
        setCourses(data);
      }
    }).catch(err => {
      console.warn('Initial courses fetch fallback:', err);
    });

    // Check backend for active user profile
    fetchCurrentUser().then(user => {
      if (user) {
        if (user.name && user.name.includes('Priyanka')) {
          user.name = 'Ample Administrator';
          localStorage.setItem('ample_current_user', JSON.stringify(user));
        }
        setCurrentUser(user);
      }
    }).catch(err => {
      console.warn('User session check:', err);
    });
  }, []);

  const handleAddCourse = (newCourse: Course) => {
    setCourses(prev => [newCourse, ...prev.filter(c => c.id !== newCourse.id)]);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
  };

  const [pendingCourse, setPendingCourse] = useState<Course | null>(null);

  // User Progress state scoped to signed-in user and persisted to backend
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    if (!currentUser) return EMPTY_PROGRESS;
    return {
      enrolledCourseIds: currentUser.enrolledCourseIds || [],
      completedLessonIds: currentUser.completedLessonIds || [],
      quizScores: currentUser.quizScores || {},
      labHours: currentUser.labHours || 0,
      streakDays: currentUser.streakDays || 0,
      certificationReady: (currentUser.completedLessonIds || []).length > 0
    };
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`ample_learn_progress_${currentUser.id}`, JSON.stringify(userProgress));
    }
  }, [userProgress, currentUser]);

  // Sync user progress when signed-in user changes
  useEffect(() => {
    if (currentUser) {
      setUserProgress({
        enrolledCourseIds: currentUser.enrolledCourseIds || [],
        completedLessonIds: currentUser.completedLessonIds || [],
        quizScores: currentUser.quizScores || {},
        labHours: currentUser.labHours || 0,
        streakDays: currentUser.streakDays || 0,
        certificationReady: (currentUser.completedLessonIds || []).length > 0
      });
    } else {
      setUserProgress(EMPTY_PROGRESS);
    }
  }, [currentUser]);

  // Auth Handlers
  const handleOpenAuth = (tab: 'signin' | 'signup' = 'signin') => {
    setAuthModalTab(tab);
    setIsOpenAuthModal(true);
  };

  const enrollAndOpenCourse = async (course: Course, alreadyEnrolledIds: string[]) => {
    if (!alreadyEnrolledIds.includes(course.id)) {
      try {
        const res = await enrollCourseApi(course.id);
        setCurrentUser(res.user);
        setUserProgress(prev => ({
          ...prev,
          enrolledCourseIds: res.enrolledCourseIds
        }));
      } catch (err) {
        console.warn('Enroll sync warning:', err);
        setUserProgress(prev => ({
          ...prev,
          enrolledCourseIds: prev.enrolledCourseIds.includes(course.id)
            ? prev.enrolledCourseIds
            : [...prev.enrolledCourseIds, course.id]
        }));
      }
    }
    setSelectedCourse(course);
    setCurrentView('lesson');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (user: User, message: string) => {
    if (user.name && user.name.includes('Priyanka')) {
      user.name = 'Ample Administrator';
    }
    setCurrentUser(user);
    localStorage.setItem('ample_current_user', JSON.stringify(user));
    showToast(message, 'success');
    if (user.role === 'admin') {
      setPendingCourse(null);
      handleNavigate('admin');
      return;
    }
    if (pendingCourse) {
      const targetCourse = pendingCourse;
      setPendingCourse(null);
      enrollAndOpenCourse(targetCourse, user.enrolledCourseIds || []);
      return;
    }
    handleNavigate('dashboard');
  };

  const handleSignOut = () => {
    if (currentUser) {
      localStorage.removeItem(`ample_learn_progress_${currentUser.id}`);
    }
    localStorage.removeItem('ample_learn_progress');
    localStorage.removeItem('ample_current_user');
    localStorage.removeItem('ample_token');
    setPendingCourse(null);
    setSelectedCourse(null);
    setCurrentUser(null);
    setUserProgress(EMPTY_PROGRESS);
    handleNavigate('landing');
    showToast('Signed out of Ample LMS.', 'info');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    showToast('Your Engineering Profile has been successfully updated!', 'success');
  };

  // Course Handlers
  const handleSelectCourse = (course: Course) => {
    if (!currentUser) {
      setPendingCourse(course);
      handleOpenAuth('signin');
      showToast('Please sign in to enroll and start learning.', 'info');
      return;
    }
    if (currentUser.role === 'admin') {
      showToast('Sign in with a trainee account to open course lessons.', 'info');
      return;
    }
    enrollAndOpenCourse(course, userProgress.enrolledCourseIds);
  };

  const handleCompleteLesson = (lessonId: string, quizScore?: number) => {
    setUserProgress(prev => {
      const alreadyDone = prev.completedLessonIds.includes(lessonId);
      const nextQuizScores = quizScore !== undefined
        ? { ...prev.quizScores, [lessonId]: Math.max(prev.quizScores[lessonId] || 0, quizScore) }
        : prev.quizScores;
      if (alreadyDone && quizScore === undefined) return prev;
      return {
        ...prev,
        completedLessonIds: alreadyDone ? prev.completedLessonIds : [...prev.completedLessonIds, lessonId],
        quizScores: nextQuizScores,
        labHours: alreadyDone ? prev.labHours : +(prev.labHours + 0.5).toFixed(1)
      };
    });

    if (currentUser) {
      completeLessonApi(lessonId, { courseId: selectedCourse?.id, quizScore })
        .then(res => {
          if (res.user) {
            setCurrentUser(res.user);
            localStorage.setItem('ample_current_user', JSON.stringify(res.user));
          }
        })
        .catch(err => console.warn('Lesson completion sync warning:', err));
    }
  };

  const handleNavigate = (view: 'landing' | 'catalog' | 'dashboard' | 'admin') => {
    if (!currentUser && view === 'dashboard') {
      handleOpenAuth('signin');
      showToast('Please sign in to access your Student Dashboard.', 'info');
      return;
    }
    const target = (currentUser?.role === 'admin' && view === 'dashboard') ? 'admin' : view;
    setCurrentView(target);
    if (window.location.hash !== `#${target}`) window.location.hash = target;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('main')?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (currentUser?.role === 'admin' && (currentView === 'dashboard' || !window.location.hash || window.location.hash === '#')) {
      handleNavigate('admin');
    }
  }, [currentUser]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page, #ffffff)', position: 'relative' }}>
      <a href="#main" className="skip-link" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      {/* Official Ample Animated SVG Preloader Screen */}
      <AmplePreloader minDurationMs={1800} />

      {/* Floating Global Toast Notification */}
      {toast && (
        <div role="status" aria-live="polite" style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? 'var(--navy-primary, #244092)' : '#059669',
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
            aria-label="Dismiss notification"
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

      {/* Authentic Ample Dark Navy Sticky Header */}
      <Header
        currentView={currentView}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onSignOut={handleSignOut}
      />

      {/* Main Dynamic View */}
      <main id="main" tabIndex={-1} style={{ flex: 1, outline: 'none' }}>
        <ErrorBoundary>
          {currentView === 'landing' && (
            <LandingHero
              onExploreTracks={() => handleNavigate('catalog')}
              onOpenDashboard={() => handleNavigate('dashboard')}
            />
          )}

          {currentView === 'catalog' && (
            <CourseCatalog
              courses={courses}
              onSelectCourse={handleSelectCourse}
              enrolledCourseIds={userProgress.enrolledCourseIds}
            />
          )}

          {currentView === 'dashboard' && currentUser && currentUser.role !== 'admin' && (
            <LMSDashboard
              courses={courses}
              userProgress={userProgress}
              currentUser={currentUser}
              onOpenCourse={handleSelectCourse}
            />
          )}

          {currentView === 'dashboard' && !currentUser && (
            <div role="alert" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--navy-dark)' }}>Sign in required</h1>
              <p style={{ margin: '.75rem 0 1.5rem', color: 'var(--text-secondary)' }}>Sign in to view your enrolled courses, lab hours, and progress.</p>
              <button className="ample-btn-primary" onClick={() => handleOpenAuth('signin')}>Sign in</button>
            </div>
          )}

          {currentView === 'admin' && currentUser?.role === 'admin' && (
            <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Loading admin portal…</div>}>
              <AdminPortal
                courses={courses}
                onNavigate={handleNavigate}
                onAddCourse={handleAddCourse}
                onUpdateCourse={handleUpdateCourse}
                onDeleteCourse={handleDeleteCourse}
              />
            </Suspense>
          )}

          {currentView === 'admin' && currentUser?.role !== 'admin' && (
            <div role="alert" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--navy-dark)' }}>Admin access required</h1>
              <p style={{ margin: '.75rem 0 1.5rem', color: 'var(--text-secondary)' }}>Sign in with an administrator account to manage courses.</p>
              <button className="ample-btn-primary" onClick={() => handleOpenAuth('signin')}>Sign in</button>
            </div>
          )}

          {currentView === 'lesson' && currentUser && selectedCourse && (
            <LessonViewer
              course={selectedCourse}
              onBack={() => handleNavigate('catalog')}
              onCompleteLesson={handleCompleteLesson}
              completedLessonIds={userProgress.completedLessonIds}
            />
          )}

          {currentView === 'lesson' && (!currentUser || !selectedCourse) && (
            <div role="alert" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--navy-dark)' }}>
                {!currentUser ? 'Sign in required' : 'Select a course to begin'}
              </h1>
              <p style={{ margin: '.75rem 0 1.5rem', color: 'var(--text-secondary)' }}>
                {!currentUser
                  ? 'Sign in with your account to access course lessons and track completion.'
                  : 'Choose a course from the catalog to launch its lesson viewer.'}
              </p>
              <button
                className="ample-btn-primary"
                onClick={() => (!currentUser ? handleOpenAuth('signin') : handleNavigate('catalog'))}
              >
                {!currentUser ? 'Sign in' : 'Browse Courses'}
              </button>
            </div>
          )}
        </ErrorBoundary>
      </main>

      {/* User Login & Signup Modal */}
      <AuthModal
        isOpen={isOpenAuthModal}
        initialTab={authModalTab}
        onClose={() => setIsOpenAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* User Profile & Certification Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={isOpenProfileModal}
          user={currentUser}
          courses={courses}
          onClose={() => setIsOpenProfileModal(false)}
          onUpdateUser={handleUpdateUser}
          onSignOut={handleSignOut}
          onOpenDashboard={() => handleNavigate('dashboard')}
        />
      )}

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default App;
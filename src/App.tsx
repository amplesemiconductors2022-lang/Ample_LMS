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
import { fetchCourses, fetchCurrentUser } from './api/client';
import type { Course, UserProgress, User } from './types';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

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

  // User Progress state with local storage persistence
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('ample_learn_progress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { }
    }
    return {
      enrolledCourseIds: ['course-vlsi-01', 'course-vlsi-02'],
      completedLessonIds: ['les-101', 'les-102'],
      quizScores: { 'les-103': 100 },
      labHours: 28.5,
      streakDays: 12,
      certificationReady: true
    };
  });

  useEffect(() => {
    localStorage.setItem('ample_learn_progress', JSON.stringify(userProgress));
  }, [userProgress]);

  // Sync user progress if current user changes
  useEffect(() => {
    if (currentUser) {
      setUserProgress(prev => ({
        ...prev,
        enrolledCourseIds: currentUser.enrolledCourseIds || prev.enrolledCourseIds,
        completedLessonIds: currentUser.completedLessonIds || prev.completedLessonIds,
        labHours: currentUser.labHours !== undefined ? currentUser.labHours : prev.labHours,
        streakDays: currentUser.streakDays !== undefined ? currentUser.streakDays : prev.streakDays
      }));
    }
  }, [currentUser]);

  // Auth Handlers
  const handleOpenAuth = (tab: 'signin' | 'signup' = 'signin') => {
    setAuthModalTab(tab);
    setIsOpenAuthModal(true);
  };

  const handleAuthSuccess = (user: User, message: string) => {
    if (user.name && user.name.includes('Priyanka')) {
      user.name = 'Ample Administrator';
    }
    setCurrentUser(user);
    localStorage.setItem('ample_current_user', JSON.stringify(user));
    showToast(message, 'success');
    if (user.role === 'admin') {
      handleNavigate('admin');
    } else {
      handleNavigate('dashboard');
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('ample_current_user');
    localStorage.removeItem('ample_token');
    handleNavigate('landing');
    showToast('Signed out of Ample LMS.', 'info');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    showToast('Your Engineering Profile has been successfully updated!', 'success');
  };

  // Course Handlers
  const handleSelectCourse = (course: Course) => {
    if (!userProgress.enrolledCourseIds.includes(course.id)) {
      setUserProgress(prev => ({
        ...prev,
        enrolledCourseIds: [...prev.enrolledCourseIds, course.id]
      }));
    }
    setSelectedCourse(course);
    setCurrentView('lesson');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteLesson = (lessonId: string) => {
    setUserProgress(prev => {
      if (prev.completedLessonIds.includes(lessonId)) return prev;
      return {
        ...prev,
        completedLessonIds: [...prev.completedLessonIds, lessonId],
        labHours: +(prev.labHours + 0.5).toFixed(1)
      };
    });
  };

  const handleNavigate = (view: 'landing' | 'catalog' | 'dashboard' | 'admin') => {
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
            <>
              <LandingHero
                onExploreTracks={() => handleNavigate('catalog')}
                onOpenDashboard={() => handleNavigate('dashboard')}
              />
              {/* Quick Catalog Preview on Landing */}
              <div style={{ backgroundColor: 'var(--bg-secondary, #f8fafc)', paddingBottom: '3rem' }}>
                <CourseCatalog
                  courses={courses}
                  onSelectCourse={handleSelectCourse}
                  enrolledCourseIds={userProgress.enrolledCourseIds}
                />
              </div>
            </>
          )}

          {currentView === 'catalog' && (
            <CourseCatalog
              courses={courses}
              onSelectCourse={handleSelectCourse}
              enrolledCourseIds={userProgress.enrolledCourseIds}
            />
          )}

          {currentView === 'dashboard' && (
            <LMSDashboard
              courses={courses}
              userProgress={userProgress}
              currentUser={currentUser}
              onOpenCourse={handleSelectCourse}
            />
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

          {currentView === 'lesson' && selectedCourse && (
            <LessonViewer
              course={selectedCourse}
              onBack={() => handleNavigate('catalog')}
              onCompleteLesson={handleCompleteLesson}
              completedLessonIds={userProgress.completedLessonIds}
            />
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
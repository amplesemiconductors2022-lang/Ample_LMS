import React, { useState } from 'react';
import {
  ArrowLeft, CheckCircle, PlayCircle, BookOpen, Code2,
  HelpCircle, ChevronRight, Check, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Course } from '../types';

interface LessonViewerProps {
  course: Course;
  onBack: () => void;
  onCompleteLesson: (lessonId: string) => void;
  completedLessonIds: string[];
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  course,
  onBack,
  onCompleteLesson,
  completedLessonIds
}) => {
  const allLessons = course.modules.flatMap(m => m.lessons);
  const [activeLessonId, setActiveLessonId] = useState<string>(allLessons[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'theory' | 'code' | 'quiz'>('theory');

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const activeLesson = allLessons.find(l => l.id === activeLessonId) || allLessons[0];
  const isCompleted = completedLessonIds.includes(activeLesson.id);
  const currentModule = course.modules.find(m => m.lessons.some(l => l.id === activeLesson.id));

  const handleSelectAnswer = (questionId: string, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleGradeQuiz = () => {
    setQuizSubmitted(true);
    const questions = activeLesson.content.quiz || [];
    const correctCount = questions.filter(q => selectedAnswers[q.id] === q.correctIndex).length;

    if (correctCount === questions.length && questions.length > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      onCompleteLesson(activeLesson.id);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
  };

  const handleNextLesson = () => {
    onCompleteLesson(activeLesson.id);
    const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex < allLessons.length - 1) {
      setActiveLessonId(allLessons[currentIndex + 1].id);
      setActiveTab('theory');
      handleResetQuiz();
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '2rem 1.5rem' }} className="animate-fade-in">
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: '#ffffff',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={15} />
          Back to Catalog
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Course Progress: <strong style={{ color: 'var(--navy-primary)' }}>
              {Math.round((completedLessonIds.filter(id => allLessons.some(l => l.id === id)).length / allLessons.length) * 100)}%
            </strong>
          </span>
          <button
            onClick={handleNextLesson}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: isCompleted ? '#ecfdf5' : 'var(--navy-primary)',
              color: isCompleted ? '#059669' : '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '0.55rem 1.25rem',
              borderRadius: '9999px',
              border: isCompleted ? '1px solid #a7f3d0' : 'none',
              cursor: 'pointer',
              boxShadow: isCompleted ? 'none' : '0 4px 12px rgba(36, 64, 146, 0.25)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {isCompleted ? <Check size={15} /> : null}
            {isCompleted ? 'Completed — Next' : 'Complete & Next'}
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Main Course Player Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.75rem', alignItems: 'start' }}>

        {/* Left Column: Syllabus Accordion */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-dark)', marginBottom: '0.2rem' }}>
              {course.title}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--navy-primary)', fontWeight: 600 }}>
              {course.category} • {course.level}
            </span>
          </div>

          <div style={{ maxHeight: '720px', overflowY: 'auto', padding: '0.75rem' }}>
            {course.modules.map((mod) => (
              <div key={mod.id} style={{ marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.4rem',
                  paddingLeft: '0.4rem'
                }}>
                  {mod.title}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {mod.lessons.map((lesson) => {
                    const isCurrent = lesson.id === activeLessonId;
                    const done = completedLessonIds.includes(lesson.id);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setActiveLessonId(lesson.id);
                          handleResetQuiz();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          textAlign: 'left',
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          border: isCurrent ? '1px solid var(--navy-border)' : '1px solid transparent',
                          backgroundColor: isCurrent ? 'var(--navy-light)' : 'transparent',
                          color: isCurrent ? 'var(--navy-primary)' : 'var(--text-secondary)',
                          fontWeight: isCurrent ? 600 : 400,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {done ? (
                          <CheckCircle size={15} color="#059669" style={{ flexShrink: 0 }} />
                        ) : lesson.type === 'video' ? (
                          <PlayCircle size={15} color={isCurrent ? 'var(--navy-primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                        ) : lesson.type === 'lab' ? (
                          <Code2 size={15} color={isCurrent ? 'var(--navy-primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                        ) : (
                          <HelpCircle size={15} color={isCurrent ? 'var(--navy-primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                        )}
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lesson.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {lesson.duration}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Lesson Content & Tabs */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.04)'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{
                fontSize: '0.72rem',
                backgroundColor: 'var(--navy-light)',
                color: 'var(--navy-primary)',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                fontWeight: 700
              }}>
                {currentModule?.title.split(':')[0]}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {activeLesson.duration} • {activeLesson.type.toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-dark)' }}>
              {activeLesson.title}
            </h2>
          </div>

          {/* Friendly Tab Switcher */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: '#ffffff',
            padding: '0.5rem 1.75rem 0'
          }}>
            <button
              onClick={() => setActiveTab('theory')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.75rem 1.25rem',
                fontSize: '0.86rem',
                fontWeight: activeTab === 'theory' ? 700 : 500,
                color: activeTab === 'theory' ? 'var(--navy-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'theory' ? '2.5px solid var(--navy-primary)' : '2.5px solid transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <BookOpen size={15} />
              Concept & Architecture
            </button>

            <button
              onClick={() => setActiveTab('code')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.75rem 1.25rem',
                fontSize: '0.86rem',
                fontWeight: activeTab === 'code' ? 700 : 500,
                color: activeTab === 'code' ? 'var(--navy-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'code' ? '2.5px solid var(--navy-primary)' : '2.5px solid transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Code2 size={15} />
              Hardware Code Snippet
            </button>

            {activeLesson.content.quiz && (
              <button
                onClick={() => setActiveTab('quiz')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.86rem',
                  fontWeight: activeTab === 'quiz' ? 700 : 500,
                  color: activeTab === 'quiz' ? 'var(--navy-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'quiz' ? '2.5px solid var(--navy-primary)' : '2.5px solid transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <HelpCircle size={15} />
                Knowledge Check ({activeLesson.content.quiz.length})
              </button>
            )}
          </div>

          {/* Tab 1: Theory */}
          {activeTab === 'theory' && (
            <div style={{ padding: '1.75rem' }}>
              <div style={{
                backgroundColor: 'var(--navy-light)',
                borderLeft: '4px solid var(--navy-primary)',
                padding: '1rem 1.25rem',
                borderRadius: '0 10px 10px 0',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '0.2rem' }}>
                  EXECUTIVE SUMMARY
                </div>
                <p style={{ color: 'var(--navy-dark)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {activeLesson.content.summary}
                </p>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy-dark)', marginBottom: '0.75rem' }}>
                  Industry Key Takeaways
                </h4>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeLesson.content.keyTakeaways.map((item, i) => (
                    <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy-dark)', marginBottom: '0.75rem' }}>
                  Detailed Technical Deep-Dive
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>
                  {activeLesson.content.theoryText}
                </p>
              </div>

              {/* Instructor Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--navy-dark)' }}>
                    Instructor Note from {course.instructor.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    "{course.instructor.title} at {course.instructor.company}: In commercial silicon tapeouts, timing sign-off represents over 60% of engineering iteration time. Always prioritize early floorplan routing estimates."
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Code Snippet */}
          {activeTab === 'code' && (
            <div style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hardware HDL / SDC / C Snippet for this Lesson
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--navy-primary)', fontWeight: 600 }}>
                  Synthesizable RTL
                </span>
              </div>
              <pre style={{
                backgroundColor: '#0a192f',
                borderRadius: '12px',
                padding: '1.25rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: '#93c5fd',
                overflowX: 'auto'
              }}>
                <code>{course.sampleLabCode || `// Sample Hardware Definition\nmodule design_core (\n    input clk,\n    input rst_n\n);\n    // Real-time logic implementation\nendmodule`}</code>
              </pre>
            </div>
          )}

          {/* Tab 3: Quiz */}
          {activeTab === 'quiz' && activeLesson.content.quiz && (
            <div style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-dark)' }}>
                  Lesson Knowledge Check
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--navy-primary)', fontWeight: 600 }}>
                  Pass with 100% to earn milestone credit
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {activeLesson.content.quiz.map((q, qIdx) => {
                  const userAnswer = selectedAnswers[q.id];
                  const isCorrect = userAnswer === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '14px',
                        padding: '1.25rem'
                      }}
                    >
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--navy-dark)', marginBottom: '1rem' }}>
                        {qIdx + 1}. {q.question}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAnswer === optIdx;
                          let optBg = '#ffffff';
                          let optBorder = 'var(--border-subtle)';
                          let optColor = 'var(--text-secondary)';

                          if (quizSubmitted) {
                            if (optIdx === q.correctIndex) {
                              optBg = '#ecfdf5';
                              optBorder = '#a7f3d0';
                              optColor = '#059669';
                            } else if (isSelected && !isCorrect) {
                              optBg = '#fef2f2';
                              optBorder = '#fecaca';
                              optColor = '#dc2626';
                            }
                          } else if (isSelected) {
                            optBg = 'var(--navy-light)';
                            optBorder = 'var(--navy-primary)';
                            optColor = 'var(--navy-primary)';
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectAnswer(q.id, optIdx)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                border: `1px solid ${optBorder}`,
                                backgroundColor: optBg,
                                color: optColor,
                                fontSize: '0.86rem',
                                textAlign: 'left',
                                cursor: quizSubmitted ? 'default' : 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: isSelected ? 'var(--navy-primary)' : 'var(--bg-secondary)',
                                color: isSelected ? '#ffffff' : 'var(--text-muted)'
                              }}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          backgroundColor: isCorrect ? '#ecfdf5' : '#fef2f2',
                          border: `1px solid ${isCorrect ? '#a7f3d0' : '#fecaca'}`,
                          fontSize: '0.82rem',
                          color: isCorrect ? '#065f46' : '#991b1b'
                        }}>
                          <strong>{isCorrect ? 'Correct! ' : 'Explanation: '}</strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit / Reset Actions */}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                {!quizSubmitted ? (
                  <button
                    onClick={handleGradeQuiz}
                    disabled={Object.keys(selectedAnswers).length < activeLesson.content.quiz.length}
                    className="ample-btn-primary"
                    style={{
                      opacity: Object.keys(selectedAnswers).length < activeLesson.content.quiz.length ? 0.5 : 1,
                      cursor: Object.keys(selectedAnswers).length < activeLesson.content.quiz.length ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Submit Answers
                  </button>
                ) : (
                  <button
                    onClick={handleResetQuiz}
                    className="ample-btn-secondary"
                  >
                    <RotateCcw size={15} />
                    Try Quiz Again
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

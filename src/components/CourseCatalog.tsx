import React, { useState, useMemo } from 'react';
import { Search, Star, Clock, Users, ArrowRight, BookOpen } from 'lucide-react';
import type { Course, Category } from '../types';
import '../chrome.css';

interface CourseCatalogProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  enrolledCourseIds: string[];
}

const FILTERS: { id: Category; label: string }[] = [
  { id: 'All', label: 'All courses' },
  { id: 'VLSI', label: 'VLSI' },
  { id: 'Embedded', label: 'Embedded' },
  { id: 'AI/ML', label: 'AI/ML' },
];

export const CourseCatalog: React.FC<CourseCatalogProps> = ({ courses, onSelectCourse, enrolledCourseIds }) => {
  const [category, setCategory] = useState<Category>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter(c => {
      if (category !== 'All' && c.category !== category) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.targetRole.toLowerCase().includes(q) ||
        c.toolsLearned.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [courses, category, query]);

  const reset = () => { setQuery(''); setCategory('All'); };

  return (
    <section className="cc" aria-labelledby="catalog-title">
      <h2 id="catalog-title">Courses taught by people who tape out chips</h2>
      <p className="cc-sub">Hands-on tracks designed and mentored by practicing architects at Ample Semiconductors.</p>

      <div className="cc-tools">
        <div className="cc-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search courses"
            placeholder="Search by role or tool, e.g. PrimeTime, UVM, FreeRTOS"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="cc-filters" role="group" aria-label="Filter by track">
          {FILTERS.map(f => (
            <button key={f.id} aria-pressed={category === f.id} onClick={() => setCategory(f.id)}>{f.label}</button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {filtered.length} {filtered.length === 1 ? 'course' : 'courses'} shown
      </p>

      <div className="cc-grid">
        {filtered.map(course => {
          const enrolled = enrolledCourseIds.includes(course.id);
          return (
            <article key={course.id} className="cc-card">
              <div className="cc-thumb">
                <img src={course.thumbnail} alt="" loading="lazy" />
                <div className="cc-tags"><span>{course.category}</span><span>{course.level}</span></div>
              </div>
              <div className="cc-body">
                <div className="cc-meta">
                  <span><Clock size={13} aria-hidden="true" />{course.duration}</span>
                  <span><Users size={13} aria-hidden="true" />{course.enrolledCount.toLocaleString()} enrolled</span>
                  <span className="rate"><Star size={13} fill="currentColor" aria-hidden="true" />{course.rating}</span>
                </div>
                <h3>{course.title}</h3>
                <p className="cc-desc">{course.description}</p>
                <div className="cc-role">
                  <b>{course.targetRole}</b>
                  <div className="cc-chips">{course.toolsLearned.map(t => <span key={t}>{t}</span>)}</div>
                </div>
                <button className={`cc-cta${enrolled ? ' enrolled' : ''}`} onClick={() => onSelectCourse(course)}>
                  {enrolled ? <><BookOpen size={16} aria-hidden="true" />Continue course</> : <>Enroll now<ArrowRight size={16} aria-hidden="true" /></>}
                </button>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <div className="cc-empty">
            <p>No courses match your search.</p>
            <button className="ample-btn-secondary" onClick={reset}>Clear search and filters</button>
          </div>
        )}
      </div>
    </section>
  );
};

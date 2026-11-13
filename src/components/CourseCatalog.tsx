import React, { useState, useMemo, useRef } from 'react';
import {
  Search, Star, Clock, Users, ArrowRight, ArrowLeft,
  BookOpen, ChevronLeft, ChevronRight, Layers
} from 'lucide-react';
import type { Course, Category } from '../types';
import '../chrome.css';

interface CourseCatalogProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  enrolledCourseIds: string[];
}

const DOMAIN_META: Record<string, { label: string; title: string }> = {
  VLSI: { label: 'VLSI', title: 'VLSI & ASIC Tapeout' },
  Embedded: { label: 'Embedded', title: 'Embedded Systems & RTOS' },
  'AI/ML': { label: 'AI/ML', title: 'AI/ML & Edge Silicon' },
};

export const CourseCatalog: React.FC<CourseCatalogProps> = ({
  courses,
  onSelectCourse,
  enrolledCourseIds
}) => {
  const [category, setCategory] = useState<Category>('All');
  const [query, setQuery] = useState('');
  const railRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter(c => {
      if (category !== 'All' && c.category !== category) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.targetRole.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.toolsLearned.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [courses, category, query]);

  const domainGroups = useMemo(() => {
    const orderedKeys = ['VLSI', 'Embedded', 'AI/ML'];
    const map = new Map<string, Course[]>();
    orderedKeys.forEach(k => map.set(k, []));

    courses.forEach(course => {
      const key = course.category || 'VLSI';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(course);
    });

    return Array.from(map.entries())
      .filter(([, list]) => list.length > 0)
      .map(([key, list]) => ({
        key,
        title: DOMAIN_META[key]?.title || key,
        courses: list,
      }));
  }, [courses]);

  const scrollRail = (domainKey: string, direction: 'left' | 'right') => {
    const el = railRefs.current[domainKey];
    if (!el) return;
    const distance = Math.max(320, Math.round(el.clientWidth * 0.72));
    el.scrollBy({
      left: direction === 'right' ? distance : -distance,
      behavior: 'smooth',
    });
  };

  const reset = () => {
    setQuery('');
    setCategory('All');
  };

  const isGroupedDomainMode = category === 'All' && query.trim() === '';

  const renderCourseCard = (course: Course, idx: number) => {
    const enrolled = enrolledCourseIds.includes(course.id);
    const visibleTools = course.toolsLearned.slice(0, 4);
    const extraCount = course.toolsLearned.length - visibleTools.length;

    return (
      <article
        key={course.id}
        className="cc-card"
        style={{ '--card-idx': idx } as React.CSSProperties}
      >
        <div className="cc-thumb">
          <img src={course.thumbnail} alt="" loading="lazy" />
          <div className="cc-tags">
            <span>{course.category}</span>
          </div>
        </div>
        <div className="cc-body">
          <div className="cc-meta">
            <span><Clock size={13} aria-hidden="true" />{course.duration}</span>
            <span><Users size={13} aria-hidden="true" />{course.enrolledCount.toLocaleString()}</span>
            <span className="rate"><Star size={13} fill="currentColor" aria-hidden="true" />{course.rating}</span>
          </div>
          <h3 title={course.title}>{course.title}</h3>
          <p className="cc-desc">{course.description}</p>
          <div className="cc-role">
            <b title={course.targetRole}>{course.targetRole}</b>
            <div className="cc-chips">
              {visibleTools.map(t => <span key={t}>{t}</span>)}
              {extraCount > 0 && <span>+{extraCount} more</span>}
            </div>
          </div>
          <button
            className={`cc-cta${enrolled ? ' enrolled' : ''}`}
            onClick={() => onSelectCourse(course)}
          >
            {enrolled ? (
              <><BookOpen size={16} aria-hidden="true" />Continue course</>
            ) : (
              <>Enroll now<ArrowRight size={16} aria-hidden="true" /></>
            )}
          </button>
        </div>
      </article>
    );
  };

  return (
    <section className="cc" aria-labelledby="catalog-title">
      <h2 id="catalog-title">Courses taught by people who tape out chips</h2>
      <p className="cc-sub">
        Hands-on courses designed and mentored by practicing architects at Ample Semiconductors.
      </p>

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
      </div>

      <p
        className="sr-only"
        aria-live="polite"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
      >
        {filtered.length} {filtered.length === 1 ? 'course' : 'courses'} shown
      </p>

      {isGroupedDomainMode ? (
        <div className="cc-domains">
          {domainGroups.map(group => (
            <div key={group.key} className="cc-domain">
              <div className="cc-domain-head">
                <div className="cc-domain-title">
                  <Layers size={19} color="var(--navy-primary)" aria-hidden="true" />
                  <h3>{group.title}</h3>
                  <span className="cc-domain-count">
                    {group.courses.length} {group.courses.length === 1 ? 'course' : 'courses'}
                  </span>
                </div>

                <div className="cc-domain-actions">
                  <button
                    type="button"
                    className="cc-scroll-btn"
                    onClick={() => scrollRail(group.key, 'left')}
                    aria-label={`Scroll ${group.title} courses left`}
                    title="Scroll left"
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    type="button"
                    className="cc-scroll-btn"
                    onClick={() => scrollRail(group.key, 'right')}
                    aria-label={`Scroll ${group.title} courses right`}
                    title="Scroll right"
                  >
                    <ChevronRight size={17} />
                  </button>
                  <button
                    type="button"
                    className="cc-viewall-btn"
                    onClick={() => setCategory(group.key as Category)}
                  >
                    View all
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="cc-rail-wrap">
                <div
                  ref={el => { railRefs.current[group.key] = el; }}
                  className="cc-rail"
                  role="region"
                  aria-label={`${group.title} courses`}
                >
                  {group.courses.map((course, idx) => renderCourseCard(course, idx))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {category !== 'All' && (
            <div className="cc-grid-bar">
              <div className="cc-domain-title">
                <Layers size={18} color="var(--navy-primary)" aria-hidden="true" />
                <h3 style={{ fontSize: '1.15rem' }}>
                  {DOMAIN_META[category]?.title || category}
                </h3>
                <span className="cc-domain-count">
                  {filtered.length} {filtered.length === 1 ? 'course' : 'courses'} available
                </span>
              </div>
              <button
                type="button"
                className="cc-back-btn"
                onClick={() => setCategory('All')}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Back to all domains
              </button>
            </div>
          )}

          <div className="cc-grid">
            {filtered.map((course, idx) => renderCourseCard(course, idx))}

            {filtered.length === 0 && (
              <div className="cc-empty">
                <p>No courses match your search.</p>
                <button className="ample-btn-secondary" onClick={reset}>
                  Clear search and filters
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

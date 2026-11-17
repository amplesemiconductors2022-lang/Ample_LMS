import React, { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Category } from '../types';
import '../landing.css';

interface LandingHeroProps {
  onExploreTracks: (category?: Category) => void;
  onOpenDashboard: () => void;
}

const TRACKS: Array<{
  title: string;
  category: Category;
  img: string;
  blurb: string;
  body: string;
  points: string[];
}> = [
  {
    title: 'VLSI & Physical Design',
    category: 'VLSI',
    img: '/assets/img/service-vlsi.jpg',
    blurb: 'RTL to GDSII on sub-14nm nodes',
    body: 'Floorplanning, clock tree synthesis, static timing analysis and physical sign-off, taught on real SoC subsystems.',
    points: ['SystemVerilog RTL and UVM 1.2 verification', 'Multi-corner timing closure', 'SkyWater 130nm GDSII tapeout checks'],
  },
  {
    title: 'Embedded Systems & RTOS',
    category: 'Embedded',
    img: '/assets/img/embedded.jpg',
    blurb: 'Firmware for ARM Cortex-M and RISC-V',
    body: 'Low-power architecture, real-time scheduling, device drivers and board bring-up.',
    points: ['FreeRTOS and Zephyr scheduling', 'Linux character and platform drivers', 'Automotive CAN and industrial telemetry'],
  },
  {
    title: 'TinyML & Edge AI Silicon',
    category: 'AI/ML',
    img: '/assets/img/service-ai-ml.jpg',
    blurb: 'Quantized models on low-power chips',
    body: 'Model compression, fixed-point math and accelerator design for edge devices.',
    points: ['Post-training INT8 and INT4 quantization', 'Systolic MAC array multipliers', 'TensorFlow Lite for Microcontrollers'],
  },
];

const STATS = [
  ['2,800+', 'Engineers upskilled'],
  ['18+', 'Tapeouts simulated'],
  ['98.4%', 'Placement pass rate'],
  ['2 hubs', 'Bengaluru and Hyderabad'],
];

// Looping background video. Skipped for reduced-motion users and Data Saver,
// who get the still poster instead.
const HeroVideo: React.FC = () => {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setPlay(!reduce && !saver);
  }, []);
  if (!play) return <img className="lp-hero-video" src="/assets/img/bg-chip.jpg" alt="" aria-hidden="true" />;
  return (
    <video
      className="lp-hero-video"
      autoPlay muted loop playsInline
      preload="metadata"
      poster="/assets/img/bg-chip.jpg"
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src="/assets/img/bg-video.mp4" type="video/mp4" />
    </video>
  );
};

export const LandingHero: React.FC<LandingHeroProps> = ({ onExploreTracks, onOpenDashboard }) => (
  <>
    <section className="lp-hero" aria-labelledby="hero-title">
      <HeroVideo />
      <div className="lp-wrap">
        <div className="lp-hero-content">
          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            Learn chip design and embedded systems from the architects who ship silicon.
          </motion.h1>
          <motion.div
            className="lp-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.button
              className="lp-btn lp-btn-solid"
              onClick={() => onExploreTracks('All')}
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            >
              Browse courses <ArrowRight size={17} aria-hidden="true" />
            </motion.button>
            <motion.button
              className="lp-btn lp-btn-ghost"
              onClick={onOpenDashboard}
              whileHover={{ scale: 1.025, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            >
              Open my dashboard
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Key Stats Bar - White Background upon scroll */}
    <section className="lp-stats-section" aria-label="Key Ample Statistics">
      <div className="lp-wrap">
        <motion.dl
          className="lp-stats"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.12,
                delayChildren: 0.05
              }
            }
          }}
        >
          {STATS.map(([n, l]) => (
            <motion.div
              key={l}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                }
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <dt>{n}</dt>
              <dd>{l}</dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>

    <section className="lp-section" aria-labelledby="disc-title">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 id="disc-title">Three disciplines, one hands-on curriculum</h2>
        <p>Each course is built around Ample Semiconductors' core services: ASIC design, embedded firmware and Edge AI.</p>
      </motion.div>

      <div className="lp-disc">
        {TRACKS.map((t, idx) => (
          <motion.article
            key={t.title}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
              duration: 0.7,
              delay: idx * 0.14,
              ease: [0.16, 1, 0.3, 1]
            }}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
          >
            <div className="disc-image-container">
              <img src={t.img} alt="" loading="lazy" />
            </div>
            <div className="body">
              <h3>{t.title}</h3>
              <p>{t.body}</p>
              <ul>
                {t.points.map(p => (
                  <motion.li
                    key={p}
                    whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  >
                    <Check size={15} aria-hidden="true" />
                    <span>{p}</span>
                  </motion.li>
                ))}
              </ul>
              <motion.button
                type="button"
                className="lp-disc-cta"
                onClick={() => onExploreTracks(t.category)}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                View all {t.category} courses <ArrowRight size={15} aria-hidden="true" />
              </motion.button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  </>
);

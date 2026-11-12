import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import '../landing.css';

interface LandingHeroProps {
  onExploreTracks: () => void;
  onOpenDashboard: () => void;
}

const TRACKS = [
  {
    title: 'VLSI & Physical Design',
    img: '/assets/img/service-vlsi.jpg',
    blurb: 'RTL to GDSII on sub-14nm nodes',
    body: 'Floorplanning, clock tree synthesis, static timing analysis and physical sign-off, taught on real SoC subsystems.',
    points: ['SystemVerilog RTL and UVM 1.2 verification', 'Multi-corner timing closure', 'SkyWater 130nm GDSII tapeout checks'],
  },
  {
    title: 'Embedded Systems & RTOS',
    img: '/assets/img/embedded.jpg',
    blurb: 'Firmware for ARM Cortex-M and RISC-V',
    body: 'Low-power architecture, real-time scheduling, device drivers and board bring-up.',
    points: ['FreeRTOS and Zephyr scheduling', 'Linux character and platform drivers', 'Automotive CAN and industrial telemetry'],
  },
  {
    title: 'TinyML & Edge AI Silicon',
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

export const LandingHero: React.FC<LandingHeroProps> = ({ onExploreTracks, onOpenDashboard }) => (
  <>
    <section className="lp-hero" aria-labelledby="hero-title">
      <div className="lp-wrap">
        <div className="lp-hero-grid">
          <div>
            <h1 id="hero-title">Learn chip design and embedded systems from the architects who ship silicon.</h1>
            <p className="lead">
              Practical tracks from Ample Semiconductors: synthesizable RTL, verification, timing closure,
              firmware and Edge AI, with lab work that mirrors real tapeouts.
            </p>
            <div className="lp-actions">
              <button className="lp-btn lp-btn-solid" onClick={onExploreTracks}>
                Browse courses <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button className="lp-btn lp-btn-ghost" onClick={onOpenDashboard}>
                Open my dashboard
              </button>
            </div>
          </div>

          <ul className="lp-tracks" aria-label="Learning tracks">
            {TRACKS.map(t => (
              <li key={t.title}>
                <button className="lp-track" onClick={onExploreTracks}>
                  <img src={t.img} alt="" loading="eager" />
                  <span><b>{t.title}</b>{t.blurb}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <dl className="lp-stats">
          {STATS.map(([n, l]) => (
            <div key={l}><dt>{n}</dt><dd>{l}</dd></div>
          ))}
        </dl>
      </div>
    </section>

    <section className="lp-section" aria-labelledby="disc-title">
      <h2 id="disc-title">Three disciplines, one hands-on curriculum</h2>
      <p>Each track is built around Ample Semiconductors' core services: ASIC design, embedded firmware and Edge AI.</p>
      <div className="lp-disc">
        {TRACKS.map(t => (
          <article key={t.title}>
            <img src={t.img} alt="" loading="lazy" />
            <div className="body">
              <h3>{t.title}</h3>
              <p>{t.body}</p>
              <ul>
                {t.points.map(p => (
                  <li key={p}><Check size={15} aria-hidden="true" /><span>{p}</span></li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  </>
);

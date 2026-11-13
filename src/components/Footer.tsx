import React from 'react';
import { MapPin, Mail, Phone, ExternalLink } from 'lucide-react';
import { AmpleLMSLogo } from './AmpleLMSLogo';

interface FooterProps {
  onNavigate: (view: 'landing' | 'catalog' | 'dashboard' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer
      id="footer"
      style={{
        backgroundImage: "url('/assets/img/footer-bg.jpg')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        color: '#cbd5e1'
      }}
    >
      {/* Dark Navy Ample Overlay as on Ample official site */}
      <div style={{
        backgroundColor: 'rgba(2, 18, 34, 0.93)',
        padding: '4.5rem 1.5rem 2.5rem'
      }}>
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Brand Column */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              marginBottom: '1.25rem',
              padding: '0.45rem 0.65rem 0.45rem 1rem',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)'
            }}>
              <AmpleLMSLogo theme="dark" variant="horizontal" size="md" />
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#94a3b8', marginBottom: '1.25rem' }}>
              The official semiconductor learning platform by Ample Semiconductors Private Limited.
              Empowering engineers in sub-14nm VLSI physical design, verification, and embedded systems.
            </p>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
              Founded 2022 • Bengaluru & Hyderabad, India
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.15rem' }}>
              Platform Navigation
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <li>
                <button
                  onClick={() => onNavigate('landing')}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0, textAlign: 'left', transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
                >
                  Platform Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalog')}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0, textAlign: 'left', transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
                >
                  Silicon Courses & Syllabi
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0, textAlign: 'left', transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
                >
                  Student LMS Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer', padding: 0, textAlign: 'left', transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#38bdf8')}
                >
                  Admin Management Console
                </button>
              </li>
            </ul>
          </div>

          {/* Innovation Centers */}
          <div>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.15rem' }}>
              Ample Innovation Centers
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <MapPin size={17} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#ffffff' }}>Bengaluru HQ:</strong>
                  <div style={{ color: '#94a3b8', lineHeight: 1.5, marginTop: '0.2rem' }}>
                    No.05, Manjushree Point, Chinnappanahalli, Bengaluru, Karnataka - 560037
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <MapPin size={17} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#ffffff' }}>Hyderabad Innovation Lab:</strong>
                  <div style={{ color: '#94a3b8', lineHeight: 1.5, marginTop: '0.2rem' }}>
                    Jana Arcade, 7-1-214/4, 4th Floor, Dharam Karan Rd, Hyderabad, Telangana - 500016
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Careers & Contact */}
          <div>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.15rem' }}>
              Careers & Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={16} color="#38bdf8" />
                <span style={{ color: '#cbd5e1' }}>info@amplesemiconductors.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Phone size={16} color="#38bdf8" />
                <span style={{ color: '#cbd5e1' }}>+91 96762 67614 / +91 95152 64762</span>
              </div>
              <div style={{ marginTop: '0.65rem' }}>
                <a
                  href="https://amplesemiconductors.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: '#38bdf8',
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontSize: '0.84rem',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#38bdf8')}
                >
                  <span>Visit Corporate Website</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Clean Bottom Bar (Without Edition Suffix) */}
        <div style={{
          maxWidth: '1360px',
          margin: '0 auto',
          paddingTop: '1.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#94a3b8'
        }}>
          <div>
            © {new Date().getFullYear()} Ample Semiconductors Private Limited. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b' }}>
            <span>Bengaluru HQ</span>
            <span>•</span>
            <span>Hyderabad Center</span>
            <span>•</span>
            <span>Semiconductors Academy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
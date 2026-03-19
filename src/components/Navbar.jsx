// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const initials = profile?.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || '?';

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">F1 Social App</span>
        </Link>

        <div className={`nav-links${menuOpen ? ' open' : ''}`}>
          <NavLink to="/races" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
            Grandes Premios
          </NavLink>
          <NavLink to="/drivers" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
            Pilotos
          </NavLink>
          <NavLink to="/seasons" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
            Temporadas
          </NavLink>
          <NavLink to="/reviews" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
            Reviews
          </NavLink>
          <NavLink to="/predictions" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
            Pronósticos
          </NavLink>
        </div>

        <div className="nav-actions">
          {user ? (
            <div className="user-menu">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link to={`/profile/${user.uid}`} className="user-avatar-btn">
                  <div className="avatar">
                    {profile?.photoURL
                      ? <img src={profile.photoURL} alt={initials} />
                      : initials}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {profile?.displayName || 'Mi perfil'}
                  </span>
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Salir</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" className="btn btn-ghost btn-sm">Iniciar sesión</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Registrarse</Link>
            </div>
          )}
          <button
            className="btn btn-icon btn-ghost"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: 'none' }}
            id="hamburger"
            aria-label="Menú"
          >
            ☰
          </button>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          #hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

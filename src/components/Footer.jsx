// src/components/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="logo">
              <span className="logo-icon">⬡</span>
              <span className="logo-text">F1 Social App</span>
            </Link>
            <p className="footer-desc">
              La comunidad abierta de fanáticos de F1. Calificá, opiná y conectá con otros apasionados del automovilismo.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Explorar</h4>
              <Link to="/races">Grandes Premios</Link>
              <Link to="/drivers">Pilotos</Link>
              <Link to="/seasons">Temporadas</Link>
              <Link to="/reviews">Reviews</Link>
            </div>
            <div className="footer-col">
              <h4>Cuenta</h4>
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/register">Registrarse</Link>
              <Link to="/profile">Mi perfil</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 F1 Social App — Open Source Project — Datos por{' '}
            <a href="https://api.jolpi.ca" target="_blank" rel="noopener">Jolpica F1 API</a>.
            No afiliado a la FIA o Formula One Group.
          </p>
        </div>
      </div>
    </footer>
  );
}

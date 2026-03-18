// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
      <div>
        <h1 className="orbitron gradient-text" style={{ fontSize: 'clamp(5rem, 15vw, 10rem)', lineHeight: 1, marginBottom: 10 }}>404</h1>
        <h2 style={{ marginBottom: 20 }}>Bandera Negra</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 30, maxWidth: 400, margin: '0 auto 30px' }}>
          Parece que te saliste de la pista. La página que estás buscando no existe o fue movida.
        </p>
        <Link to="/" className="btn btn-primary btn-lg">Volver a Boxes</Link>
      </div>
    </div>
  );
}

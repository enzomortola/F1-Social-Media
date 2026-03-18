// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/ToastContainer';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      navigate('/profile');
    } catch (err) {
      toast('Error al iniciar sesión. Revisá tus datos.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await loginWithGoogle();
      navigate('/profile');
    } catch (err) {
      toast('Error al iniciar sesión con Google.', 'error');
    }
  }

  return (
    <div className="auth-page page-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <Link to="/" className="logo" style={{ fontSize: '1.6rem' }}>
            <span className="logo-icon">⬡</span> F1 Social App
          </Link>
        </div>
        <h1 className="auth-title">Hola de nuevo</h1>
        <p className="auth-subtitle">Iniciá sesión para calificar carreras</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Tu email</label>
            <input
              type="email"
              className="input"
              placeholder="piloto@ejemplo.com"
              value={email} onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar a F1 Social App'}
          </button>
        </form>

        <div className="auth-divider">o</div>
        
        <button type="button" className="btn btn-secondary btn-full" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>

        <p className="auth-link">
          ¿No tenés cuenta? <Link to="/register">Registrate gratis</Link>
        </p>
      </div>
    </div>
  );
}

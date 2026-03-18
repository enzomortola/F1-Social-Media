// src/components/LoadingPage.jsx
export default function LoadingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ marginBottom: 16 }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando...</p>
      </div>
    </div>
  );
}

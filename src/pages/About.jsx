import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  return (
    <main className="page-wrapper about-page">
      <div className="container">
        <header className="about-header">
          <h1 className="about-title">
            Acerca de <span className="highlight-text">F1 Social App</span>
          </h1>
          <p className="about-subtitle">
            Una plataforma Open Source creada por y para fanáticos del automovilismo.
          </p>
        </header>

        <section className="about-content">
          <div className="card open-source-card">
            <div className="card-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </div>
            <h2>Proyecto Open Source</h2>
            <p>
              F1 Social Media es un proyecto de código abierto. Creemos en la colaboración comunitaria y en construir juntos la mejor plataforma para los apasionados de la Fórmula 1.
            </p>
            <div className="github-cta">
              <a 
                href="https://github.com/enzomortola/F1-Social-Media" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
                Ver Repositorio en GitHub
              </a>
            </div>
          </div>

          <div className="about-grid">
            <div className="card about-card">
              <svg className="card-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="18" r="3"></circle>
                <circle cx="6" cy="6" r="3"></circle>
                <path d="M13 6h3a2 2 0 0 1 2 2v7"></path>
                <line x1="6" y1="9" x2="6" y2="21"></line>
              </svg>
              <h3>¡Sumate a Desarrollar!</h3>
              <p>
                ¿Sos desarrollador? Podés contribuir al proyecto creando issues, proponiendo mejoras o enviando tus <strong>Pull Requests</strong>. Toda ayuda es bienvenida para seguir creciendo.
              </p>
            </div>

            <div className="card about-card">
              <svg className="card-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h3>Comunidad</h3>
              <p>
                Nuestro objetivo principal es fomentar una comunidad sana donde podamos debatir, analizar y compartir nuestra pasión por cada Gran Premio.
              </p>
            </div>

            <div className="card about-card">
              <svg className="card-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              <h3>Compartí</h3>
              <p>
                Hacé predicciones, calificá a los pilotos tras cada carrera y compartí tus resultados con otros fanáticos en la plataforma.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

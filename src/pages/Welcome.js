import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Welcome.css';

export default function Welcome() {
  return (
    <div className="welcome-container">
      <header className="welcome-header">
        <h1><a href="/">Prompt Logbuch</a></h1>
      </header>

      <main className="welcome-main">
        <section className="welcome-hero">
          <h2>Willkommen beim Prompt Logbuch</h2>
          <p className="hero-text">
            Ein einfaches Tool, um deine KI-Prompts zu organisieren, 
            zu verbessern und zu dokumentieren.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary">Konto erstellen</Link>
            <Link to="/login" className="btn-secondary">Anmelden</Link>
          </div>
        </section>

        <section className="welcome-features">
          <h2>Funktionen</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Speichern & Organisieren</h3>
              <p>Speichere und organisiere deine Prompts an einem zentralen Ort.</p>
            </div>
            <div className="feature-card">
              <h3>Versionierung</h3>
              <p>Erstelle neue Versionen und verbessere deine Prompts kontinuierlich.</p>
            </div>
            <div className="feature-card">
              <h3>Qualitätsbewertung</h3>
              <p>Bewerte die Qualität deiner Prompts und behalte den Überblick.</p>
            </div>
            <div className="feature-card">
              <h3>Notizen</h3>
              <p>Füge Notizen und Verbesserungsvorschläge zu deinen Prompts hinzu.</p>
            </div>
          </div>
        </section>

        <section className="welcome-philosophy">
          <h2>Philosophie</h2>
          <blockquote>
            "Don't let anyone sell you on some complex solution. 
            They're saying you need a jumbo jet when really you need a bicycle."
            <footer>— Derek Sivers</footer>
          </blockquote>
          <p>
            Das Prompt Logbuch ist bewusst einfach gehalten. Es konzentriert sich auf das Wesentliche: 
            Deine Prompts zu dokumentieren und zu verbessern. Keine unnötigen Features, 
            keine komplizierte Benutzeroberfläche.
          </p>
        </section>

        <section className="welcome-contact">
          <h2>Kontakt</h2>
          <p>
            Hast du Fragen oder Anregungen? 
            <a href="mailto:kontakt@promptlog.de">Schreib mir eine E-Mail</a>.
          </p>
        </section>
      </main>

      <footer className="welcome-footer">
        <p>
          <small>
            © {new Date().getFullYear()} Prompt Logbuch. 
            Inspiriert von <a href="https://sive.rs" target="_blank" rel="noopener noreferrer">Derek Sivers</a>.
          </small>
        </p>
      </footer>
    </div>
  );
} 
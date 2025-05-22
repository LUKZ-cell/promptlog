import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="sivers-container">
      <header className="sivers-header">
        <h1>Prompt Logbuch</h1>
      </header>
      
      <main className="sivers-content" style={{ textAlign: 'center' }}>
        <h2>Willkommen beim Prompt Logbuch</h2>
        <p>Die einfache Art, Ihre KI-Prompts zu organisieren und zu verbessern</p>
        
        <div style={{ marginTop: '2em' }}>
          <button 
            onClick={() => navigate('/login')} 
            className="sivers-button"
            style={{ marginRight: '1em' }}
          >
            Anmelden
          </button>
          <button 
            onClick={() => navigate('/register')} 
            className="sivers-button"
          >
            Registrieren
          </button>
        </div>
      </main>
    </div>
  );
} 
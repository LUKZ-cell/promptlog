import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h2>Willkommen beim Prompt Logbuch</h2>
      <button onClick={() => navigate('/login')}>Anmelden</button>
      <button onClick={() => navigate('/register')}>Registrieren</button>
    </div>
  );
} 
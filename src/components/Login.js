import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError('Anmeldung fehlgeschlagen: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sivers-container">
      <header className="sivers-header">
        <h1>Prompt Logbuch</h1>
      </header>
      
      {error && <div className="sivers-notification error">{error}</div>}
      
      <main className="sivers-content">
        <form onSubmit={handleSubmit} className="sivers-form">
          <div>
            <label htmlFor="email">E-Mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>
        
        <p style={{marginTop: "2em", textAlign: "center"}}>
          Noch kein Konto? <Link to="/register">Registrieren</Link>
        </p>
      </main>
    </div>
  );
} 
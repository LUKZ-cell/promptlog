import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import '../styles/Login.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwörter stimmen nicht überein');
    }

    try {
      setError('');
      setLoading(true);
      const { user } = await signup(email, password);
      
      // Benutzer in Firestore speichern
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
        allowAutoComplete: true
      });

      navigate('/');
    } catch (error) {
      setError('Registrierung fehlgeschlagen: ' + error.message);
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
          
          <div>
            <label htmlFor="confirm-password">Passwort bestätigen</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Registrieren...' : 'Registrieren'}
          </button>
        </form>
        
        <p style={{marginTop: "2em", textAlign: "center"}}>
          Bereits ein Konto? <Link to="/login">Anmelden</Link>
        </p>
      </main>
    </div>
  );
} 
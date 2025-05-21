import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { db } from '../firebase/config';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAutoCompleteDialog, setShowAutoCompleteDialog] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Die Passwörter stimmen nicht überein');
    }

    try {
      setError('');
      setLoading(true);
      const userCredential = await signup(email, password);
      
      // Zeige den Dialog für die Autovervollständigungs-Einstellung
      setShowAutoCompleteDialog(true);
      
      // Speichere die E-Mail-Adresse in der Firestore-Datenbank
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        uid: userCredential.user.uid,
        createdAt: new Date(),
        allowAutoComplete: false // Standardmäßig deaktiviert
      });

    } catch (error) {
      setError('Fehler bei der Registrierung: ' + error.message);
      setLoading(false);
    }
  }

  const handleAutoCompletePreference = async (allowAutoComplete) => {
    try {
      // Aktualisiere die Einstellung in der Datenbank
      await setDoc(doc(db, 'users', (await auth.currentUser).uid), {
        allowAutoComplete: allowAutoComplete
      }, { merge: true });
      
      setShowAutoCompleteDialog(false);
      navigate('/dashboard');
    } catch (error) {
      setError('Fehler beim Speichern der Einstellung: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      <h2>Registrieren</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="password-container">
          <label>Passwort:</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <div className="password-container">
          <label>Passwort bestätigen:</label>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <button disabled={loading} type="submit">
          Registrieren
        </button>
      </form>
      <div className="login-link">
        Bereits registriert? <Link to="/login">Hier anmelden</Link>
      </div>

      {/* Dialog für Autovervollständigungs-Einstellung */}
      {showAutoCompleteDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>E-Mail-Autovervollständigung</h3>
            <p>Möchten Sie, dass Ihre E-Mail-Adresse für die Autovervollständigung gespeichert wird?</p>
            <div className="dialog-buttons">
              <button onClick={() => handleAutoCompletePreference(true)}>Ja, speichern</button>
              <button onClick={() => handleAutoCompletePreference(false)}>Nein, nicht speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
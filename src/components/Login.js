import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('allowAutoComplete', '==', true));
        const querySnapshot = await getDocs(q);
        const emails = querySnapshot.docs.map(doc => doc.data().email);
        setEmailSuggestions(emails);
      } catch (error) {
        console.error('Fehler beim Laden der E-Mail-Adressen:', error);
      }
    };

    fetchEmails();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Fehler beim Anmelden: ' + error.message);
    }
    setLoading(false);
  }

  return (
    <div className="login-container">
      <h2>Anmelden</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            list="email-suggestions"
            required
          />
          <datalist id="email-suggestions">
            {emailSuggestions.map((suggestion, index) => (
              <option key={index} value={suggestion} />
            ))}
          </datalist>
        </div>
        <div>
          <label>Passwort:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button disabled={loading} type="submit">
          Anmelden
        </button>
      </form>
    </div>
  );
} 
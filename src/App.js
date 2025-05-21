import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import PromptVersionsPage from './pages/PromptVersionsPage';
import './App.css';

// Geschützte Route, die prüft, ob ein Benutzer authentifiziert ist
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    // Wenn kein Benutzer angemeldet ist, zur Anmeldeseite umleiten
    return <Navigate to="/login" />;
  }
  
  return children;
}

// Leitet bereits angemeldete Benutzer um
function AuthRedirect({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  if (currentUser && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register')) {
    // Wenn ein Benutzer bereits angemeldet ist, zum Dashboard umleiten
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Öffentliche Routen mit Umleitung für angemeldete Benutzer */}
            <Route path="/" element={
              <AuthRedirect>
                <Home />
              </AuthRedirect>
            } />
            <Route path="/login" element={
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            } />
            <Route path="/register" element={
              <AuthRedirect>
                <Register />
              </AuthRedirect>
            } />
            
            {/* Geschützte Routen */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Route für die Anzeige von Prompt-Versionen */}
            <Route path="/versions/:basePromptId" element={
              <ProtectedRoute>
                <PromptVersionsPage />
              </ProtectedRoute>
            } />
            
            {/* Weitere Routen werden hier hinzugefügt */}
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import '../styles/PromptVersionsPage.css';

export default function PromptVersionsPage() {
  const { basePromptId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promptTitle, setPromptTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    if (currentUser && basePromptId) {
      fetchPromptVersions();
    } else if (!currentUser) {
      setError("Bitte zuerst anmelden.");
      setLoading(false);
    }
  }, [currentUser, basePromptId]);

  const fetchPromptVersions = async () => {
    setLoading(true);
    setError('');
    try {
      const promptsRef = collection(db, 'prompts');
      const q = query(
        promptsRef,
        where('userId', '==', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const allUserPrompts = [];
      querySnapshot.forEach((doc) => {
        allUserPrompts.push({ id: doc.id, ...doc.data() });
      });

      const filteredVersions = allUserPrompts.filter(
        (prompt) => prompt.basePromptId === basePromptId || prompt.id === basePromptId
      );
      
      if (filteredVersions.length > 0) {
        setPromptTitle(filteredVersions[0].goalPrompt);
        filteredVersions.sort((a, b) => b.version - a.version);
        setVersions(filteredVersions);
      } else {
        setError('Keine Versionen für diesen Prompt gefunden.');
      }

    } catch (err) {
      console.error("Fehler beim Laden der Prompt-Versionen:", err);
      setError('Fehler beim Laden der Versionen: ' + err.message);
    }
    setLoading(false);
  };

  const handleDeleteVersion = async () => {
    if (!versionToDelete) return;
    try {
      await deleteDoc(doc(db, 'prompts', versionToDelete));
      setShowDeleteModal(false);
      setVersionToDelete(null);
      fetchPromptVersions();
    } catch (error) {
      setError('Fehler beim Löschen der Version: ' + error.message);
      setShowDeleteModal(false);
      setVersionToDelete(null);
    }
  };

  const handleCopyPrompt = async (versionId) => {
    const versionToCopy = versions.find(v => v.id === versionId);
    if (!versionToCopy) return;
    try {
      await navigator.clipboard.writeText(versionToCopy.promptText);
      setCopySuccess('Prompt-Text kopiert!');
      
      // Button-Text temporär ändern
      const button = document.getElementById(`copy-button-${versionId}`);
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Kopiert';
        setTimeout(() => {
          button.textContent = originalText;
          setCopySuccess('');
        }, 1500);
      } else {
        setTimeout(() => setCopySuccess(''), 1500);
      }
    } catch (error) {
      setError('Fehler beim Kopieren: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="sivers-container">
        <header className="sivers-header">
          <h1>Prompt Versionen</h1>
        </header>
        <main className="sivers-content">
          <p>Lade Versionen...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sivers-container">
        <header className="sivers-header">
          <h1>Prompt Versionen</h1>
        </header>
        <main className="sivers-content">
          <div className="sivers-notification error">{error}</div>
          <button onClick={() => navigate('/dashboard')} className="sivers-button" style={{marginTop: "1em"}}>
            Zurück zum Dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="sivers-container">
      <header className="sivers-header">
        <h1>Versionen für: {promptTitle}</h1>
        <div className="sivers-nav">
          <button onClick={() => navigate('/dashboard')} className="sivers-button">
            Zurück zum Dashboard
          </button>
        </div>
      </header>

      {error && <div className="sivers-notification error">{error}</div>}
      {copySuccess && <div className="sivers-notification success">{copySuccess}</div>}

      <main className="sivers-content">
        {versions.length === 0 && !loading && (
          <p>Keine Versionen für diesen Prompt gefunden.</p>
        )}

        {versions.length > 0 && (
          <div>
            {versions.map((version) => (
              <div key={version.id} className="sivers-card" style={{marginBottom: "2em"}}>
                <h3>Version {version.version} <small style={{fontWeight: "normal", color: "#666"}}>
                  Erstellt am: {new Date(version.createdAt.seconds * 1000).toLocaleString()}
                </small></h3>
                
                <div style={{marginBottom: "1em"}}>
                  <strong>Ziel:</strong> {version.goalPrompt}
                </div>
                
                <div style={{marginBottom: "1em"}}>
                  <strong>Prompt-Text:</strong>
                  <div style={{
                    backgroundColor: "#f6f8fa", 
                    padding: "1em", 
                    marginTop: "0.5em",
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                    border: "1px solid #ddd",
                    borderRadius: "3px"
                  }}>
                    {version.promptText}
                  </div>
                </div>
                
                <div style={{marginBottom: "1em"}}>
                  <strong>Zufriedenheit:</strong> {version.satisfaction}/5
                </div>
                
                {version.notes && (
                  <div style={{marginBottom: "1em"}}>
                    <strong>Notizen:</strong> {version.notes}
                  </div>
                )}
                
                <button 
                  id={`copy-button-${version.id}`}
                  onClick={() => handleCopyPrompt(version.id)} 
                  className="sivers-button"
                  style={{marginRight: "0.5em"}}
                >
                  Kopieren
                </button>
                <button 
                  onClick={() => { setVersionToDelete(version.id); setShowDeleteModal(true); }} 
                  className="sivers-button sivers-danger-button"
                >
                  Version löschen
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {showDeleteModal && (
        <div className="sivers-dialog-overlay">
          <div className="sivers-dialog">
            <h3>Version löschen</h3>
            <p>Möchtest du diese Version wirklich löschen?</p>
            <div className="sivers-dialog-buttons">
              <button onClick={handleDeleteVersion}>Löschen</button>
              <button onClick={() => { setShowDeleteModal(false); setVersionToDelete(null); }}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
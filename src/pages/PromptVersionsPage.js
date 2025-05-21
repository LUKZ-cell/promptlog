import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import '../styles/PromptVersionsPage.css'; // CSS-Datei wird später erstellt

export default function PromptVersionsPage() {
  const { basePromptId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promptTitle, setPromptTitle] = useState('');

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
      // Query für alle Prompts, deren basePromptId dem URL-Parameter entspricht
      // ODER deren eigene ID dem basePromptId entspricht (für den Fall, dass es der allererste Prompt ist)
      const q = query(
        promptsRef,
        where('userId', '==', currentUser.uid),
        // Die folgende Bedingung ist komplexer und muss in Firestore-Regeln oder clientseitig gehandhabt werden
        // Für den Moment holen wir alle Prompts des Nutzers und filtern clientseitig,
        // bis eine bessere Firestore-Query gefunden wird oder wir mehrere Queries machen.
        // Alternativ: Zwei Queries - eine für basePromptId, eine für id === basePromptId und dann zusammenführen.
      );

      const querySnapshot = await getDocs(q);
      const allUserPrompts = [];
      querySnapshot.forEach((doc) => {
        allUserPrompts.push({ id: doc.id, ...doc.data() });
      });

      // Filtere die Prompts, die entweder die basePromptId haben oder deren eigene ID die basePromptId ist
      const filteredVersions = allUserPrompts.filter(
        (prompt) => prompt.basePromptId === basePromptId || prompt.id === basePromptId
      );
      
      if (filteredVersions.length > 0) {
        // Setze den Titel basierend auf dem ersten gefundenen Prompt (sollte für alle Versionen eines Themas gleich sein)
        setPromptTitle(filteredVersions[0].goalPrompt);
        // Sortiere nach Version absteigend
        filteredVersions.sort((a, b) => b.version - a.version);
        setVersions(filteredVersions);
      } else {
        setError('Keine Versionen für diesen Prompt gefunden oder Zugriff verweigert.');
      }

    } catch (err) {
      console.error("Fehler beim Laden der Prompt-Versionen:", err);
      setError('Fehler beim Laden der Versionen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="versions-container"><p>Lade Versionen...</p></div>;
  }

  if (error) {
    return (
      <div className="versions-container">
        <p className="error-message">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
          Zurück zum Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="versions-container">
      <div className="versions-header">
        <h1>Versionen für: {promptTitle}</h1>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
          Zurück zum Dashboard
        </button>
      </div>

      {versions.length === 0 && !loading && (
        <p>Keine Versionen für diesen Prompt gefunden.</p>
      )}

      {versions.length > 0 && (
        <ul className="versions-list">
          {versions.map((version) => (
            <li key={version.id} className="version-item">
              <div className="version-item-header">
                <h2>Version {version.version}</h2>
                <span className="version-date">
                  Erstellt am: {new Date(version.createdAt.seconds * 1000).toLocaleString()}
                </span>
              </div>
              <div className="version-details">
                <p><strong>Ziel:</strong> {version.goalPrompt}</p>
                <p><strong>Prompt-Text:</strong></p>
                <pre className="prompt-text-display">{version.promptText}</pre>
                <p><strong>Zufriedenheit:</strong> {version.satisfaction}/5</p>
                {version.notes && <p><strong>Notizen:</strong> {version.notes}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 
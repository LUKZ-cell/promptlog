import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { FaPlay, FaEdit, FaHistory } from 'react-icons/fa';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPromptVersion, setNewPromptVersion] = useState({
    version: 1,
    goalPrompt: '',
    promptText: '',
    satisfaction: 3,
    notes: ''
  });
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchPrompts();
    }
  }, [currentUser]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      if (!currentUser) {
        console.error('Kein Benutzer angemeldet');
        setError('Kein Benutzer angemeldet');
        setLoading(false);
        return;
      }

      const promptsRef = collection(db, 'prompts');
      const q = query(
        promptsRef,
        where('userId', '==', currentUser.uid),
      );
      
      const querySnapshot = await getDocs(q);
      const promptsList = [];
      
      querySnapshot.forEach((doc) => {
        promptsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPrompts(promptsList);
      setError('');
    } catch (error) {
      console.error('Fehler beim Laden der Prompts:', error);
      setError('Fehler beim Laden der Prompts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPromptVersion({
      ...newPromptVersion,
      [name]: name === 'satisfaction' ? parseInt(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const isNewVersion = selectedPromptId !== null;
      
      let latestVersionNumber = 1;
      let basePromptId = null;
      let promptTitle = newPromptVersion.goalPrompt;

      if (isNewVersion) {
        const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
        if (selectedPrompt) {
          latestVersionNumber = selectedPrompt.version + 1;
          basePromptId = selectedPrompt.basePromptId || selectedPrompt.id;
          promptTitle = selectedPrompt.goalPrompt;
        }
      }
      
      const newPromptData = {
        userId: currentUser.uid,
        version: isNewVersion ? latestVersionNumber : 1,
        goalPrompt: promptTitle,
        promptText: newPromptVersion.promptText,
        satisfaction: newPromptVersion.satisfaction,
        notes: newPromptVersion.notes,
        createdAt: new Date(),
        basePromptId: isNewVersion ? basePromptId : (await addDoc(collection(db, 'prompts'), {})).id
      };

      if (!isNewVersion) {
        const newBaseDocRef = doc(db, "prompts", newPromptData.basePromptId);
        await updateDoc(newBaseDocRef, newPromptData);
      } else {
        await addDoc(collection(db, 'prompts'), newPromptData);
      }
      
      setNewPromptVersion({
        version: 1,
        goalPrompt: '',
        promptText: '',
        satisfaction: 3,
        notes: ''
      });
      setSelectedPromptId(null);
      setError('');
      fetchPrompts();
    } catch (error) {
      console.error('Fehler beim Speichern des Prompts:', error);
      setError('Fehler beim Speichern des Prompts: ' + error.message);
    }
  };

  const createNewVersion = (promptId) => {
    const selectedPrompt = prompts.find(p => p.id === promptId);
    if (selectedPrompt) {
      setSelectedPromptId(promptId);
      setNewPromptVersion({
        version: selectedPrompt.version + 1,
        goalPrompt: selectedPrompt.goalPrompt,
        promptText: selectedPrompt.promptText,
        satisfaction: selectedPrompt.satisfaction,
        notes: ''
      });
    }
  };

  const handleShowVersions = (basePromptId) => {
    navigate(`/versions/${basePromptId}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      setError('Fehler beim Abmelden: ' + error.message);
    }
  };

  const groupedPrompts = prompts.reduce((acc, prompt) => {
    const groupId = prompt.basePromptId || prompt.id;
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(prompt);
    acc[groupId].sort((a, b) => b.version - a.version);
    return acc;
  }, {});

  const latestPrompts = Object.values(groupedPrompts).map(group => group[0]).sort((a,b) => b.createdAt - a.createdAt);

  const filteredPrompts = latestPrompts.filter(prompt =>
    prompt.goalPrompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Prompt Logbuch</h1>
        <button onClick={handleLogout} className="btn-logout">Abmelden</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="prompt-form-container">
        <h2>{selectedPromptId ? `Neue Version für "${prompts.find(p=>p.id === selectedPromptId)?.goalPrompt}" erstellen` : 'Neuen Prompt erstellen'}</h2>
        <form onSubmit={handleSubmit} className="prompt-form">
          <div className="form-group">
            <label htmlFor="goalPrompt">{selectedPromptId ? 'Thema/Ziel des Prompts (Basis)' : 'Thema/Ziel des Prompts'}</label>
            <input
              type="text"
              id="goalPrompt"
              name="goalPrompt"
              value={newPromptVersion.goalPrompt}
              onChange={handleInputChange}
              required
              disabled={selectedPromptId !== null}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="promptText">Prompt-Text</label>
            <textarea
              id="promptText"
              name="promptText"
              value={newPromptVersion.promptText}
              onChange={handleInputChange}
              required
              rows="5"
            ></textarea>
          </div>
          
          <div className="form-group satisfaction-group">
            <label htmlFor="satisfaction">Zufriedenheit (1-5)</label>
            <div className="satisfaction-slider-row">
              <input
                type="range"
                id="satisfaction"
                name="satisfaction"
                min="1"
                max="5"
                value={newPromptVersion.satisfaction}
                onChange={handleInputChange}
                className="satisfaction-slider"
              />
              <span className="satisfaction-value">{newPromptVersion.satisfaction}</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notizen</label>
            <textarea
              id="notes"
              name="notes"
              value={newPromptVersion.notes}
              onChange={handleInputChange}
              rows="3"
            ></textarea>
          </div>
          
          <button type="submit" className="btn-primary">
            {selectedPromptId ? 'Version speichern' : 'Prompt speichern'}
          </button>
          
          {selectedPromptId && (
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => {
                setSelectedPromptId(null);
                setNewPromptVersion({
                  version: 1,
                  goalPrompt: '',
                  promptText: '',
                  satisfaction: 3,
                  notes: ''
                });
              }}
            >
              Abbrechen
            </button>
          )}
        </form>
      </div>
      
      <div className="prompts-container">
        <h2>Meine Prompts</h2>
        <div style={{marginBottom: '1.5rem', maxWidth: 400}}>
          <input
            type="text"
            placeholder="Prompts suchen..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.7rem 1rem',
              borderRadius: 8,
              border: '1.5px solid #e0e3ea',
              fontSize: '1.05rem',
              background: '#f8fafd',
              marginBottom: 0
            }}
          />
        </div>
        {loading ? (
          <p>Lade Prompts...</p>
        ) : filteredPrompts.length === 0 ? (
          <p>Keine Prompts gefunden.</p>
        ) : (
          <ul className="prompts-list">
            {filteredPrompts.map((prompt) => (
              <li key={prompt.id} className="prompt-item">
                <div className="prompt-header">
                  <h3>Aktuellster Prompt: {prompt.goalPrompt} (v{prompt.version})</h3>
                  <div className="prompt-actions">
                    {/* <button onClick={() => handleOpenPrompt(prompt.id)} title="Prompt öffnen/ausführen" className="icon-btn">
                      <FaPlay />
                    </button> */}
                  </div>
                </div>
                <div className="prompt-details">
                  <p><strong>Text:</strong> {prompt.promptText.substring(0, 100)}{prompt.promptText.length > 100 ? '...' : ''}</p>
                  <p><strong>Zufriedenheit:</strong> {prompt.satisfaction}/5</p>
                  {prompt.notes && <p><strong>Notizen:</strong> {prompt.notes}</p>}
                  <p><small>Erstellt am: {new Date(prompt.createdAt.seconds * 1000).toLocaleString()}</small></p>
                </div>
                <div className="prompt-versions">
                  <button onClick={() => handleShowVersions(prompt.basePromptId || prompt.id)} className="btn-tertiary" title="Vorherige Versionen anzeigen">
                    <FaHistory /> Vorherige Versionen ({groupedPrompts[prompt.basePromptId || prompt.id]?.length -1 || 0})
                  </button>
                  <button onClick={() => createNewVersion(prompt.id)} className="btn-secondary" style={{marginLeft: '10px'}} title="Neue Version dieses Prompts erstellen">
                    Neue Version erstellen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 
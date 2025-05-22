import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, orderBy, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { FaPlay, FaEdit, FaHistory, FaTrash } from 'react-icons/fa';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

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
    if (name === 'satisfaction') {
      const satisfactionValue = parseInt(value);
      const percent = ((satisfactionValue - 1) / 4) * 100;
      e.target.style.setProperty('--satisfaction-percent', `${percent}%`);
    }
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

  const handleCopyPrompt = async (promptId) => {
    const promptToCopy = prompts.find(p => p.id === promptId);
    if (!promptToCopy) return;
    try {
      await navigator.clipboard.writeText(promptToCopy.promptText);
      setCopySuccess('Prompt-Text kopiert!');
      
      // Button-Text temporär ändern
      const button = document.getElementById(`copy-button-${promptId}`);
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

  const handleDeletePrompt = async () => {
    if (!promptToDelete) return;
    try {
      const prompt = prompts.find(p => p.id === promptToDelete);
      if (!prompt) return;
      const groupId = prompt.basePromptId || prompt.id;
      const toDelete = prompts.filter(p => (p.basePromptId || p.id) === groupId);
      for (const p of toDelete) {
        await deleteDoc(doc(db, 'prompts', p.id));
      }
      setShowDeleteModal(false);
      setPromptToDelete(null);
      fetchPrompts();
    } catch (error) {
      setError('Fehler beim Löschen der Prompts: ' + error.message);
      setShowDeleteModal(false);
      setPromptToDelete(null);
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
    <div className="sivers-container">
      <header className="sivers-header">
        <h1>Prompt Logbuch</h1>
        <div className="sivers-nav">
          <button onClick={handleLogout} className="sivers-button">Abmelden</button>
        </div>
      </header>
      
      {error && <div className="sivers-notification error">{error}</div>}
      {copySuccess && <div className="sivers-notification success">{copySuccess}</div>}
      
      <main className="sivers-content">
        <section>
          <h2>{selectedPromptId ? `Neue Version für "${prompts.find(p=>p.id === selectedPromptId)?.goalPrompt}" erstellen` : 'Neuen Prompt erstellen'}</h2>
          <form onSubmit={handleSubmit} className="sivers-form">
            <div>
              <label htmlFor="goalPrompt">{selectedPromptId ? 'Thema/Ziel des Prompts (Basis)' : 'Was ist das Ziel des Prompts?'}</label>
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
            
            <div>
              <label htmlFor="promptText">Prompt-Text</label>
              <textarea
                id="promptText"
                name="promptText"
                value={newPromptVersion.promptText}
                onChange={e => {
                  handleInputChange(e);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                required
                placeholder="Füge hier deinen prompt ein"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="satisfaction">Zufriedenheit (1=schlecht, 5=exzellent)</label>
              <input
                type="number"
                id="satisfaction"
                name="satisfaction"
                min="1"
                max="5"
                value={newPromptVersion.satisfaction}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="notes">Notizen</label>
              <textarea
                id="notes"
                name="notes"
                value={newPromptVersion.notes}
                onChange={handleInputChange}
                placeholder="Das hat gut funktioniert... Das möchte ich verbessern..."
              ></textarea>
            </div>
            
            <div style={{marginTop: "1em"}}>
              <button type="submit">
                {selectedPromptId ? 'Version speichern' : 'Prompt speichern'}
              </button>
              
              {selectedPromptId && (
                <button 
                  type="button"
                  style={{marginLeft: "0.5em"}}
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
            </div>
          </form>
        </section>
        
        <section style={{marginTop: "3em"}}>
          <h2>Meine Prompts</h2>
          <div className="sivers-search">
            <input
              type="text"
              placeholder="Prompts suchen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <p>Lade Prompts...</p>
          ) : filteredPrompts.length === 0 ? (
            <p>Keine Prompts gefunden.</p>
          ) : (
            <div>
              {filteredPrompts.map((prompt) => (
                <div key={prompt.id} className="sivers-card">
                  <h3>{prompt.goalPrompt} <small style={{fontWeight: "normal"}}>v{prompt.version}</small></h3>
                  
                  <p>{prompt.promptText.substring(0, 150)}{prompt.promptText.length > 150 ? '...' : ''}</p>
                  
                  <div style={{marginBottom: "0.5em"}}>
                    <strong>Zufriedenheit:</strong> {prompt.satisfaction}/5
                    {prompt.notes && (
                      <div style={{marginTop: "0.5em"}}>
                        <strong>Notizen:</strong> {prompt.notes}
                      </div>
                    )}
                    <div style={{fontSize: "0.9em", marginTop: "0.5em", color: "#666"}}>
                      Erstellt am: {new Date(prompt.createdAt.seconds * 1000).toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{marginTop: "1em"}}>
                    <button 
                      id={`copy-button-${prompt.id}`}
                      onClick={() => handleCopyPrompt(prompt.id)} 
                      className="sivers-button"
                    >
                      Kopieren
                    </button>
                    <button onClick={() => handleShowVersions(prompt.basePromptId || prompt.id)} className="sivers-button">
                      Versionen ({groupedPrompts[prompt.basePromptId || prompt.id]?.length -1 || 0})
                    </button>
                    <button onClick={() => {
                      setSelectedPromptId(prompt.id);
                      setNewPromptVersion({
                        version: prompt.version + 1,
                        goalPrompt: prompt.goalPrompt,
                        promptText: prompt.promptText,
                        satisfaction: prompt.satisfaction,
                        notes: prompt.notes
                      });
                    }} className="sivers-button">
                      Bearbeiten
                    </button>
                    <button onClick={() => { setPromptToDelete(prompt.id); setShowDeleteModal(true); }} className="sivers-button sivers-danger-button">
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showDeleteModal && (
        <div className="sivers-dialog-overlay">
          <div className="sivers-dialog">
            <h3>Prompt löschen</h3>
            <p>Möchtest du diesen Prompt und alle seine Versionen wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="sivers-dialog-buttons">
              <button onClick={handleDeletePrompt}>Löschen</button>
              <button onClick={() => { setShowDeleteModal(false); setPromptToDelete(null); }}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
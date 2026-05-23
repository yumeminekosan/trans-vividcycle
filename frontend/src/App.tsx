import { useState, useEffect } from 'react';
import PersonaForm from './components/PersonaForm';
import GraphView from './components/GraphView';
import AuthForm from './components/AuthForm';
import RelationForm from './components/RelationForm';
import SettingsModal from './components/SettingsModal';
import RecommendationPanel from './components/RecommendationPanel';
import CommunityPanel from './components/CommunityPanel';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<any | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[], edges: any[] }>({ nodes: [], edges: [] });
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('api_url') || '/api');

  useEffect(() => {
    if (token) {
      fetchMyPersonas();
    }
  }, [token]);

  const fetchMyPersonas = async () => {
    try {
      const response = await fetch(`${apiUrl}/my/personas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPersonas(data);
      }
    } catch (error) {
      console.error('Failed to fetch personas:', error);
    }
  };

  const handleLogin = (userData: any, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    setShowAuth(false);
    fetchMyPersonas();
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setPersonas([]);
    setSelectedPersona(null);
    setGraphData({ nodes: [], edges: [] });
  };

  const handlePersonaCreated = (persona: any) => {
    setPersonas([...personas, persona]);
    setSelectedPersona(persona);
  };

  const handleLoadGraph = async (personaId: string) => {
    try {
      const response = await fetch(`${apiUrl}/graph/${personaId}`);
      const data = await response.json();
      setGraphData(data);
    } catch (error) {
      console.error('Failed to load graph:', error);
    }
  };

  const handleRelationCreated = (_relation: any) => {
    // Reload graph to show new relation
    if (selectedPersona) {
      handleLoadGraph(selectedPersona.id);
    }
  };

  const handleApiUrlChange = (url: string) => {
    setApiUrl(url);
  };

  return (
    <div className="app">
      <header>
        <h1>Queer Relationship Atlas</h1>
        <div className="auth-section">
          {user ? (
            <>
              <span>Welcome, {user.username}</span>
              <button onClick={() => setShowSettings(true)}>⚙️</button>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)}>Login / Register</button>
          )}
        </div>
      </header>
      
      {showSettings && (
        <SettingsModal 
          apiUrl={apiUrl}
          onSave={handleApiUrlChange}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {showAuth && (
        <AuthForm 
          apiUrl={apiUrl}
          onLogin={handleLogin}
          onClose={() => setShowAuth(false)}
        />
      )}
      
      <main>
        <section className="sidebar">
          {token && (
            <>
              <h2>Create Persona</h2>
              <PersonaForm 
                apiUrl={apiUrl}
                token={token}
                onPersonaCreated={handlePersonaCreated}
              />
            </>
          )}
          
          <h2>Personas</h2>
          <ul className="persona-list">
            {personas.map(p => (
              <li 
                key={p.id}
                className={selectedPersona?.id === p.id ? 'selected' : ''}
                onClick={() => {
                  setSelectedPersona(p);
                  handleLoadGraph(p.id);
                }}
              >
                {p.name}
              </li>
            ))}
          </ul>
          
          {selectedPersona && token && (
            <>
              <h2>Create Relation</h2>
              <RelationForm
                apiUrl={apiUrl}
                token={token}
                fromPersona={selectedPersona}
                allPersonas={personas}
                onRelationCreated={handleRelationCreated}
              />
            </>
          )}
          
          {selectedPersona && (
            <>
              <h2>Recommendations</h2>
              <RecommendationPanel 
                apiUrl={apiUrl}
                personaId={selectedPersona.id}
              />
            </>
          )}
          
          <h2>Communities</h2>
          <CommunityPanel 
            apiUrl={apiUrl}
            token={token}
          />
        </section>
        
        <section className="graph-area">
          <GraphView 
            data={graphData}
            onNodeClick={(node) => console.log('Clicked:', node)}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
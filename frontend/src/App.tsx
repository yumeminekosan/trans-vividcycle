import { useState, useEffect } from 'react';
import PersonaForm from './components/PersonaForm';
import GraphView from './components/GraphView';
import AuthForm from './components/AuthForm';
import RelationForm from './components/RelationForm';
import SettingsModal from './components/SettingsModal';
import RecommendationPanel from './components/RecommendationPanel';
import CommunityPanel from './components/CommunityPanel';
import BrowsePage from './components/BrowsePage';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<any | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[], edges: any[] }>({ nodes: [], edges: [] });
  const [view, setView] = useState<'home' | 'browse' | 'personas' | 'relations' | 'communities'>('browse');
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
    if (selectedPersona) {
      handleLoadGraph(selectedPersona.id);
    }
  };

  const handleApiUrlChange = (url: string) => {
    setApiUrl(url);
  };

  if ((view as string) === 'browse') {
    return <BrowsePage apiUrl={apiUrl} />;
  }

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="logo-section">
          <h1>🌈 跨性别关系图谱</h1>
          <p className="subtitle">TRANS VIVID CYCLE</p>
        </div>

        <div className="nav-menu">
          <div className={`nav-item ${view === 'browse' ? 'active' : ''}`} onClick={() => setView('browse')}>
            <span className="nav-icon">🔍</span>
            <span className="nav-label">档案浏览</span>
          </div>
          <div className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">我的图谱</span>
          </div>
          <div className={`nav-item ${view === 'personas' ? 'active' : ''}`} onClick={() => setView('personas')}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">角色管理</span>
          </div>
          <div className={`nav-item ${view === 'relations' ? 'active' : ''}`} onClick={() => setView('relations')}>
            <span className="nav-icon">🔗</span>
            <span className="nav-label">关系网络</span>
          </div>
          <div className={`nav-item ${view === 'communities' ? 'active' : ''}`} onClick={() => setView('communities')}>
            <span className="nav-icon">🏘️</span>
            <span className="nav-label">社群</span>
          </div>
        </div>

        <div className="user-section">
          {user ? (
            <>
              <div className="user-info">
                <div className="user-avatar">👤</div>
                <span className="user-name">{user.username}</span>
              </div>
              <div className="user-actions">
                <button onClick={() => setShowSettings(true)}>设置</button>
                <button onClick={handleLogout}>退出</button>
              </div>
            </>
          ) : (
            <div className="user-actions">
              <button onClick={() => setShowAuth(true)} style={{ width: '100%' }}>
                登录 / 注册
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
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

        {view === 'home' && (
          <>
            <div className="page-header">
              <h2><span className="header-icon">🏠</span> 我的关系图谱</h2>
              <p>管理和探索你的跨性别关系网络</p>
            </div>
            
            <div className="content-layout">
              <section className="sidebar-content">
                {token && (
                  <>
                    <h3>创建角色</h3>
                    <PersonaForm 
                      apiUrl={apiUrl}
                      token={token}
                      onPersonaCreated={handlePersonaCreated}
                    />
                  </>
                )}
                
                <h3>我的角色</h3>
                <div className="cards-grid">
                  {personas.map(p => (
                    <div 
                      key={p.id}
                      className={`persona-card-ark ${selectedPersona?.id === p.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPersona(p);
                        handleLoadGraph(p.id);
                      }}
                    >
                      <div className="card-header">
                        <div className="card-avatar">
                          {p.avatar ? <img src={p.avatar} alt={p.name} /> : p.name[0]}
                        </div>
                        <div className="card-title">
                          <h4>{p.name}</h4>
                          <span className="pronouns">{p.pronouns}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedPersona && token && (
                  <>
                    <h3>创建关系</h3>
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
                    <h3>推荐</h3>
                    <RecommendationPanel 
                      apiUrl={apiUrl}
                      personaId={selectedPersona.id}
                    />
                  </>
                )}
              </section>
              
              <section className="graph-area">
                <GraphView 
                  data={graphData}
                  onNodeClick={(node) => console.log('Clicked:', node)}
                />
              </section>
            </div>
          </>
        )}

        {view === 'personas' && (
          <div className="page-header">
            <h2><span className="header-icon">👤</span> 角色管理</h2>
            <p>管理你的所有角色档案</p>
          </div>
        )}

        {view === 'relations' && (
          <div className="page-header">
            <h2><span className="header-icon">🔗</span> 关系网络</h2>
            <p>查看和分析你的关系连接</p>
          </div>
        )}

        {view === 'communities' && (
          <>
            <div className="page-header">
              <h2><span className="header-icon">🏘️</span> 社群</h2>
              <p>加入和管理跨性别社群</p>
            </div>
            <CommunityPanel apiUrl={apiUrl} token={token} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
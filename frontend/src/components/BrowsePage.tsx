import { useState, useEffect } from 'react';
import './BrowsePage.css';

interface BrowsePageProps {
  apiUrl: string;
}

interface Persona {
  id: string;
  name: string;
  bio: string;
  pronouns: string;
  tags: string[];
  avatar: string;
  links: string[];
}

function BrowsePage({ apiUrl }: BrowsePageProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ personas: 0, relations: 0, users: 0, communities: 0 });
  const [activeTab, setActiveTab] = useState<'profile' | 'relations' | 'graph'>('profile');

  useEffect(() => {
    fetchStats();
    fetchTags();
    fetchBrowseData();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/stats`);
      if (response.ok) {
        setStats(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${apiUrl}/tags`);
      if (response.ok) {
        setTags(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchBrowseData = async (tag?: string) => {
    setLoading(true);
    try {
      const url = tag 
        ? `${apiUrl}/browse?tag=${encodeURIComponent(tag)}&limit=50`
        : `${apiUrl}/browse?limit=50`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPersonas(data.personas || []);
      }
    } catch (error) {
      console.error('Failed to fetch browse data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchBrowseData();
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/search?q=${encodeURIComponent(searchQuery)}&type=persona&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setPersonas(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag('');
      fetchBrowseData();
    } else {
      setSelectedTag(tag);
      fetchBrowseData(tag);
    }
  };

  // Use function to avoid unused warning
  const _useHandleTagClick = handleTagClick;

  const handlePersonaClick = async (persona: Persona) => {
    setSelectedPersona(persona);
    setActiveTab('profile');
    try {
      const response = await fetch(`${apiUrl}/public-graph/${persona.id}`);
      if (response.ok) {
        const data = await response.json();
        setGraphData(data);
      }
    } catch (error) {
      console.error('Failed to fetch graph:', error);
    }
  };

  return (
    <div className="app">
      {/* Left Panel - Persona List */}
      <div className="left-panel">
        <div className="panel-header">
          <h1>🌈 档案室</h1>
          <p className="subtitle">TRANS VIVID CYCLE</p>
          <div style={{ marginTop: '12px', fontSize: '0.8em', color: '#666' }}>
            👥 {stats.personas} 角色 | 🔗 {stats.relations} 关系
          </div>
        </div>

        <div className="archive-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索角色..."
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="operator-list">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className={`operator-item ${selectedPersona?.id === persona.id ? 'selected' : ''}`}
              onClick={() => handlePersonaClick(persona)}
            >
              <div className="op-avatar">
                {persona.avatar ? (
                  <img src={persona.avatar} alt={persona.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                ) : (
                  persona.name[0]
                )}
              </div>
              <div className="op-info">
                <div className="op-name">{persona.name}</div>
                <div className="op-tags">
                  {persona.pronouns} {persona.tags?.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Detail View */}
      <div className="right-panel">
        {selectedPersona ? (
          <>
            <div className="top-bar">
              <h2>
                <span>📋</span> 角色档案
              </h2>
              <div className="top-actions">
                <button onClick={() => setSelectedPersona(null)}>返回列表</button>
              </div>
            </div>

            <div className="detail-content">
              {/* Profile Card */}
              <div className="profile-card">
                <div className="profile-avatar-large">
                  {selectedPersona.avatar ? (
                    <img src={selectedPersona.avatar} alt={selectedPersona.name} />
                  ) : (
                    selectedPersona.name[0]
                  )}
                </div>
                <div className="profile-details">
                  <h3>{selectedPersona.name}</h3>
                  <div className="profile-meta">
                    <div className="meta-item">
                      <span className="label">代词:</span>
                      <span className="value">{selectedPersona.pronouns || '未设置'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="label">标签:</span>
                      <span className="value">{selectedPersona.tags?.join(', ') || '无'}</span>
                    </div>
                  </div>
                  <p className="profile-bio">{selectedPersona.bio || '暂无简介'}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="section-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  基础档案
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'relations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('relations')}
                >
                  关系网络 ({graphData.edges.length})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
                  onClick={() => setActiveTab('graph')}
                >
                  可视化
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'profile' && (
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">档案编号</span>
                    <span className="info-value">{selectedPersona.id.slice(0, 8)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">代词偏好</span>
                    <span className="info-value">{selectedPersona.pronouns || '未设置'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">身份标签</span>
                    <span className="info-value">{selectedPersona.tags?.join(', ') || '无'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">外部链接</span>
                    <span className="info-value">{selectedPersona.links?.length || 0} 个</span>
                  </div>
                </div>
              )}

              {activeTab === 'relations' && (
                <div className="relations-list-ark">
                  {graphData.edges.length === 0 ? (
                    <div className="empty-state-ark">
                      <div className="icon">🔒</div>
                      <p>该角色暂无公开关系</p>
                    </div>
                  ) : (
                    graphData.edges.map((edge, i) => {
                      const target = graphData.nodes.find(n => n.id === edge.target);
                      return (
                        <div key={i} className="relation-item">
                          <div className="relation-avatar">
                            {target?.name?.[0] || '?'}
                          </div>
                          <div className="relation-info">
                            <h4>{target?.name || '未知角色'}</h4>
                            <div className="relation-type">{edge.type}</div>
                          </div>
                          <div className="relation-weight">
                            <div className="weight-bar">
                              <div className="weight-fill" style={{ width: `${edge.weight * 100}%` }}></div>
                            </div>
                            <span style={{ fontSize: '0.8em', color: '#666' }}>{edge.weight}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'graph' && (
                <div className="graph-section">
                  <h3>🕸️ 关系可视化</h3>
                  <div className="graph-container">
                    {graphData.nodes.length <= 1 ? (
                      <div className="empty-state-ark">
                        <div className="icon">🔒</div>
                        <p>该角色暂无公开关系</p>
                      </div>
                    ) : (
                      <svg viewBox="0 0 400 300" style={{ width: '100%', height: '300px' }}>
                        {graphData.edges.map((edge, i) => {
                          const angle = (i * 2 * Math.PI) / graphData.edges.length;
                          const sx = 200 + Math.cos(angle) * 100;
                          const sy = 150 + Math.sin(angle) * 100;
                          const tx = 200;
                          const ty = 150;
                          
                          return (
                            <g key={i}>
                              <line
                                x1={sx} y1={sy} x2={tx} y2={ty}
                                stroke="#4a9eff"
                                strokeWidth={edge.weight * 3}
                                opacity={0.6}
                              />
                            </g>
                          );
                        })}
                        
                        {graphData.nodes.map((node, i) => {
                          const isCenter = node.id === selectedPersona.id;
                          const angle = isCenter ? 0 : (i * 2 * Math.PI) / (graphData.nodes.length - 1);
                          const x = isCenter ? 200 : 200 + Math.cos(angle) * 100;
                          const y = isCenter ? 150 : 150 + Math.sin(angle) * 100;
                          
                          return (
                            <g key={node.id}>
                              <circle
                                cx={x} cy={y}
                                r={isCenter ? 30 : 20}
                                fill={isCenter ? '#ff6b9d' : '#4a9eff'}
                                opacity={0.8}
                              />
                              <text
                                x={x} y={y + 5}
                                textAnchor="middle"
                                fill="white"
                                fontSize="12"
                              >
                                {node.name.substring(0, 4)}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state-ark" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="icon">📋</div>
            <p>选择左侧角色查看档案</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowsePage;
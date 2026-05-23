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

  const handlePersonaClick = async (persona: Persona) => {
    setSelectedPersona(persona);
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
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.personas}</div>
          <div className="stat-label">角色</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.relations}</div>
          <div className="stat-label">关系</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.users}</div>
          <div className="stat-label">用户</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.communities}</div>
          <div className="stat-label">社群</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索角色、标签、描述..."
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? '搜索中...' : '🔍 搜索'}
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="tags-section">
        <h3>🏷️ 热门标签</h3>
        <div className="tags-cloud">
          {tags.map((tag) => (
            <button
              key={tag.tag}
              className={`tag-pill ${selectedTag === tag.tag ? 'active' : ''}`}
              onClick={() => handleTagClick(tag.tag)}
            >
              {tag.tag} ({tag.count})
            </button>
          ))}
        </div>
      </div>

      {/* Personas Grid */}
      <div className="page-header">
        <h2>
          <span className="header-icon">📋</span>
          角色档案 {selectedTag && `(标签: ${selectedTag})`}
        </h2>
      </div>

      {personas.length === 0 ? (
        <div className="empty-state-ark">
          <div className="icon">📭</div>
          <p>暂无角色数据</p>
        </div>
      ) : (
        <div className="cards-grid">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className={`persona-card-ark ${selectedPersona?.id === persona.id ? 'selected' : ''}`}
              onClick={() => handlePersonaClick(persona)}
            >
              <div className="card-header">
                <div className="card-avatar">
                  {persona.avatar ? (
                    <img src={persona.avatar} alt={persona.name} />
                  ) : (
                    persona.name[0]
                  )}
                </div>
                <div className="card-title">
                  <h4>{persona.name}</h4>
                  <span className="pronouns">{persona.pronouns}</span>
                </div>
              </div>
              
              <div className="card-body">
                <p className="bio">{persona.bio?.substring(0, 100)}...</p>
                <div className="card-tags">
                  {persona.tags?.map((tag) => (
                    <span key={tag} className="card-tag">{tag}</span>
                  ))}
                </div>
              </div>
              
              <div className="card-footer">
                <div className="card-stats">
                  <span>🔗 {persona.links?.length || 0} 链接</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Graph Panel */}
      {selectedPersona && (
        <div className="graph-panel-ark">
          <h3>
            <span>🕸️</span> {selectedPersona.name} 的关系网络
          </h3>
          <div className="graph-visualization-ark">
            {graphData.nodes.length <= 1 ? (
              <div className="empty-state-ark">
                <div className="icon">🔒</div>
                <p>该角色暂无公开关系</p>
              </div>
            ) : (
              <svg viewBox="0 0 400 300" style={{ width: '100%', height: '300px' }}>
                {graphData.edges.map((edge, i) => {
                  const source = graphData.nodes.find(n => n.id === edge.source);
                  const target = graphData.nodes.find(n => n.id === edge.target);
                  if (!source || !target) return null;
                  
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
                      <text
                        x={(sx + tx) / 2}
                        y={(sy + ty) / 2}
                        fill="#a0a0b0"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {edge.type}
                      </text>
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
  );
}

export default BrowsePage;
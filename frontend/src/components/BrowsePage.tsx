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

interface Relation {
  from: string;
  to: string;
  type: string;
  weight: number;
}

function BrowsePage({ apiUrl }: BrowsePageProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [_relations, setRelations] = useState<Relation[]>([]);
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
        setRelations(data.relations || []);
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
        setRelations([]);
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
    <div className="browse-page">
      <header className="browse-header">
        <h1>🌈 跨性别关系图谱</h1>
        <p className="subtitle">探索性少数社群的关系网络</p>
        <div className="stats-bar">
          <span>👥 {stats.personas} 个角色</span>
          <span>🔗 {stats.relations} 个关系</span>
          <span>👤 {stats.users} 个用户</span>
          <span>🏘️ {stats.communities} 个社群</span>
        </div>
      </header>

      <div className="search-section">
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

      <div className="tags-section">
        <h3>🏷️ 热门标签</h3>
        <div className="tags-cloud">
          {tags.map((tag) => (
            <button
              key={tag.tag}
              className={`tag-button ${selectedTag === tag.tag ? 'active' : ''}`}
              onClick={() => handleTagClick(tag.tag)}
            >
              {tag.tag} ({tag.count})
            </button>
          ))}
        </div>
      </div>

      <div className="content-grid">
        <div className="personas-list">
          <h3>📋 角色列表 {selectedTag && `(标签: ${selectedTag})`}</h3>
          {personas.length === 0 ? (
            <p className="empty-state">暂无角色数据</p>
          ) : (
            <div className="persona-cards">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  className={`persona-card ${selectedPersona?.id === persona.id ? 'selected' : ''}`}
                  onClick={() => handlePersonaClick(persona)}
                >
                  <div className="persona-avatar">
                    {persona.avatar ? (
                      <img src={persona.avatar} alt={persona.name} />
                    ) : (
                      <div className="avatar-placeholder">{persona.name[0]}</div>
                    )}
                  </div>
                  <div className="persona-info">
                    <h4>{persona.name}</h4>
                    <p className="pronouns">{persona.pronouns}</p>
                    <p className="bio">{persona.bio?.substring(0, 100)}...</p>
                    <div className="tags">
                      {persona.tags?.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedPersona && (
          <div className="graph-panel">
            <h3>🕸️ {selectedPersona.name} 的关系网络</h3>
            <div className="graph-visualization">
              {graphData.nodes.length <= 1 ? (
                <p className="empty-state">该角色暂无公开关系</p>
              ) : (
                <svg viewBox="0 0 400 300" className="graph-svg">
                  {graphData.edges.map((edge, i) => {
                    const source = graphData.nodes.find(n => n.id === edge.source);
                    const target = graphData.nodes.find(n => n.id === edge.target);
                    if (!source || !target) return null;
                    
                    const sx = 200 + Math.cos(i * 2 * Math.PI / graphData.edges.length) * 100;
                    const sy = 150 + Math.sin(i * 2 * Math.PI / graphData.edges.length) * 100;
                    const tx = 200;
                    const ty = 150;
                    
                    return (
                      <g key={i}>
                        <line
                          x1={sx} y1={sy} x2={tx} y2={ty}
                          stroke="#ff6b9d"
                          strokeWidth={edge.weight * 3}
                          opacity={0.6}
                        />
                        <text
                          x={(sx + tx) / 2}
                          y={(sy + ty) / 2}
                          fill="#666"
                          fontSize="10"
                        >
                          {edge.type}
                        </text>
                      </g>
                    );
                  })}
                  
                  {graphData.nodes.map((node, i) => {
                    const isCenter = node.id === selectedPersona.id;
                    const x = isCenter ? 200 : 200 + Math.cos(i * 2 * Math.PI / (graphData.nodes.length - 1)) * 100;
                    const y = isCenter ? 150 : 150 + Math.sin(i * 2 * Math.PI / (graphData.nodes.length - 1)) * 100;
                    
                    return (
                      <g key={node.id}>
                        <circle
                          cx={x} cy={y}
                          r={isCenter ? 30 : 20}
                          fill={isCenter ? '#ff6b9d' : '#4ecdc4'}
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
            
            <div className="relations-list">
              <h4>🔗 关系详情</h4>
              {graphData.edges.length === 0 ? (
                <p>暂无公开关系</p>
              ) : (
                <ul>
                  {graphData.edges.map((edge, i) => {
                    const target = graphData.nodes.find(n => n.id === edge.target);
                    return (
                      <li key={i}>
                        → {target?.name} ({edge.type}, 权重: {edge.weight})
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowsePage;
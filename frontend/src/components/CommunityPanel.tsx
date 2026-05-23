import { useState, useEffect } from 'react';

interface CommunityPanelProps {
  apiUrl: string;
  token: string | null;
}

function CommunityPanel({ apiUrl, token }: CommunityPanelProps) {
  const [communities, setCommunities] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCommunity, setNewCommunity] = useState({ name: '', description: '', type: 'group' });

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await fetch(`${apiUrl}/communities`);
      const data = await response.json();
      setCommunities(data);
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/community`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCommunity)
      });

      if (response.ok) {
        setShowCreate(false);
        setNewCommunity({ name: '', description: '', type: 'group' });
        fetchCommunities();
      }
    } catch (error) {
      console.error('Failed to create community:', error);
    }
  };

  const handleJoin = async (communityId: string) => {
    if (!token) return;

    try {
      await fetch(`${apiUrl}/community/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      alert('Joined community!');
    } catch (error) {
      console.error('Failed to join community:', error);
    }
  };

  return (
    <div className="community-panel">
      <h3>Communities</h3>
      
      {token && (
        <button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'Create Community'}
        </button>
      )}
      
      {showCreate && (
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={newCommunity.name}
              onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={newCommunity.description}
              onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})}
            />
          </div>
          <button type="submit">Create</button>
        </form>
      )}
      
      <ul className="community-list">
        {communities.map((community: any) => (
          <li key={community.id}>
            <div className="community-info">
              <strong>{community.name}</strong>
              <span className="community-type">{community.type}</span>
              <p>{community.description}</p>
            </div>
            {token && (
              <button onClick={() => handleJoin(community.id)}>Join</button>
            )}
          </li>
        ))}
      </ul>
      
      {communities.length === 0 && <p>No communities yet.</p>}
    </div>
  );
}

export default CommunityPanel;
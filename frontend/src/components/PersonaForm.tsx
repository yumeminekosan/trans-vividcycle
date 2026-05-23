import { useState } from 'react';

interface PersonaFormProps {
  apiUrl: string;
  token: string;
  onPersonaCreated: (persona: any) => void;
}

function PersonaForm({ apiUrl, token, onPersonaCreated }: PersonaFormProps) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [tags, setTags] = useState('');
  const [avatar, setAvatar] = useState('');
  const [links, setLinks] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/persona`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          bio,
          pronouns,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          avatar,
          links: links.split(',').map(l => l.trim()).filter(Boolean)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create persona');
      }

      const persona = await response.json();
      onPersonaCreated(persona);
      
      // Reset form
      setName('');
      setBio('');
      setPronouns('');
      setTags('');
      setAvatar('');
      setLinks('');
    } catch (error) {
      console.error('Error creating persona:', error);
      alert('Failed to create persona');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="persona-form">
      <div className="form-group">
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Bio:</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Pronouns:</label>
        <input
          type="text"
          value={pronouns}
          onChange={(e) => setPronouns(e.target.value)}
          placeholder="she/they"
        />
      </div>

      <div className="form-group">
        <label>Tags (comma separated):</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="transfem, hacker, artist"
        />
      </div>

      <div className="form-group">
        <label>Avatar URL:</label>
        <input
          type="text"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
        />
      </div>

      <div className="form-group">
        <label>Links (comma separated):</label>
        <input
          type="text"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder="https://twitter.com/username, https://github.com/username"
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Persona'}
      </button>
    </form>
  );
}

export default PersonaForm;
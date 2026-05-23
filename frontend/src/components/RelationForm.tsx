import { useState } from 'react';

interface RelationFormProps {
  apiUrl: string;
  token: string;
  fromPersona: any;
  allPersonas: any[];
  onRelationCreated: (relation: any) => void;
}

function RelationForm({ apiUrl, token, fromPersona, allPersonas, onRelationCreated }: RelationFormProps) {
  const [toPersonaId, setToPersonaId] = useState('');
  const [type, setType] = useState('friend');
  const [visibility, setVisibility] = useState('private');
  const [weight, setWeight] = useState(0.5);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const relationTypes = [
    'friend',
    'emotionally_safe_person',
    'co_creator',
    'mentor',
    'former_partner'
  ];

  const visibilityOptions = [
    { value: 'private', label: 'Private' },
    { value: 'mutual', label: 'Mutual' },
    { value: 'friends_only', label: 'Friends Only' },
    { value: 'public', label: 'Public' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/relation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          from: fromPersona.id,
          to: toPersonaId,
          type,
          visibility,
          weight,
          description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create relation');
      }

      const relation = await response.json();
      onRelationCreated(relation);
      
      // Reset form
      setToPersonaId('');
      setType('friend');
      setVisibility('private');
      setWeight(0.5);
      setDescription('');
    } catch (error) {
      console.error('Error creating relation:', error);
      alert('Failed to create relation');
    } finally {
      setLoading(false);
    }
  };

  const availablePersonas = allPersonas.filter(p => p.id !== fromPersona.id);

  return (
    <form onSubmit={handleSubmit} className="relation-form">
      <div className="form-group">
        <label>From:</label>
        <input type="text" value={fromPersona.name} disabled />
      </div>

      <div className="form-group">
        <label>To:</label>
        <select
          value={toPersonaId}
          onChange={(e) => setToPersonaId(e.target.value)}
          required
        >
          <option value="">Select a persona...</option>
          {availablePersonas.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Relation Type:</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {relationTypes.map(t => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Visibility:</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          {visibilityOptions.map(v => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Weight (0-1): {weight}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(parseFloat(e.target.value))}
        />
      </div>

      <div className="form-group">
        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional description..."
        />
      </div>

      <button type="submit" disabled={loading || !toPersonaId}>
        {loading ? 'Creating...' : 'Create Relation'}
      </button>
    </form>
  );
}

export default RelationForm;
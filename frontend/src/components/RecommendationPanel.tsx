import { useState, useEffect } from 'react';

interface RecommendationPanelProps {
  apiUrl: string;
  personaId: string;
}

function RecommendationPanel({ apiUrl, personaId }: RecommendationPanelProps) {
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (personaId) {
      fetchRecommendations();
    }
  }, [personaId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/recommendation/${personaId}`);
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading recommendations...</div>;
  if (!recommendations) return null;

  return (
    <div className="recommendation-panel">
      <h3>Recommendations</h3>
      
      {recommendations.common_friends?.length > 0 && (
        <div className="recommendation-section">
          <h4>Friends of Friends</h4>
          <ul>
            {recommendations.common_friends.map((item: any) => (
              <li key={item.persona.id}>
                {item.persona.name} ({item.common_count} mutual)
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {recommendations.common_tags?.length > 0 && (
        <div className="recommendation-section">
          <h4>Common Interests</h4>
          <ul>
            {recommendations.common_tags.map((item: any) => (
              <li key={item.persona.id}>
                {item.persona.name} ({item.common_tags} shared tags)
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {recommendations.common_friends?.length === 0 && 
       recommendations.common_tags?.length === 0 && (
        <p>No recommendations yet. Add more relations!</p>
      )}
    </div>
  );
}

export default RecommendationPanel;
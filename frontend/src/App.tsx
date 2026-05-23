import { useState, useEffect } from 'react';
import PersonaForm from './components/PersonaForm';
import GraphView from './components/GraphView';
import './App.css';

function App() {
  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });

  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    // Load initial data
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    // For now, we'll fetch graph data for a specific persona
    // In MVP, we'll list all personas
  };

  const handlePersonaCreated = (persona) => {
    setPersonas([...personas, persona]);
    setSelectedPersona(persona);
  };

  const handleLoadGraph = async (personaId) => {
    try {
      const response = await fetch(`${API_URL}/graph/${personaId}`);
      const data = await response.json();
      setGraphData(data);
    } catch (error) {
      console.error('Failed to load graph:', error);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Queer Relationship Atlas</h1>
      </header>
      
      <main>
        <section className="sidebar">
          <h2>Create Persona</h2>
          <PersonaForm 
            apiUrl={API_URL}
            onPersonaCreated={handlePersonaCreated}
          />
          
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

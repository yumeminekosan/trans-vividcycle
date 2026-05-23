import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface GraphViewProps {
  data: {
    nodes: any[];
    edges: any[];
  };
  onNodeClick?: (node: any) => void;
}

function GraphView({ data, onNodeClick }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements: cytoscape.ElementDefinition[] = [
      ...data.nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.name,
          ...node,
        },
      })),
      ...data.edges.map((edge) => ({
        data: {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          label: edge.type,
          ...edge,
        },
      })),
    ];

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(label)',
            'width': 40,
            'height': 40,
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'color': '#fff',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
          },
        },
      ],
      layout: {
        name: 'force',
        fit: true,
        padding: 10,
      },
    });

    // Click handler
    cyRef.current.on('tap', 'node', (event) => {
      const node = event.target.data();
      onNodeClick?.(node);
    });

    return () => {
      cyRef.current?.destroy();
    };
  }, [data, onNodeClick]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '600px',
        border: '1px solid #ddd',
        borderRadius: '4px',
      }}
    />
  );
}

export default GraphView;

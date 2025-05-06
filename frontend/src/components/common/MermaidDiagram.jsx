// src/components/MermaidDiagram.jsx
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid (only once)
mermaid.initialize({
  startOnLoad: false, // We'll render manually
  theme: 'default', // or 'dark', 'forest', etc.
  // securityLevel: 'loose', // If you have issues with complex diagrams, but be cautious
  // loglevel: 'debug', // For debugging
});

const MermaidDiagram = ({ chartData, diagramId }) => {
  const mermaidRef = useRef(null);
  const uniqueId = diagramId || `mermaid-diagram-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (mermaidRef.current && chartData) {
      try {
        // mermaid.render needs an ID for the SVG output
        mermaid.render(uniqueId, chartData, (svgCode) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svgCode;
          }
        });
      } catch (error) {
        console.error("Mermaid rendering error:", error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<pre>Error rendering Mermaid diagram:\n${chartData}\n${error.message}</pre>`;
        }
      }
    } else if (mermaidRef.current) {
        mermaidRef.current.innerHTML = ''; // Clear if no chartData
    }
  }, [chartData, uniqueId]);

  // If chartData is simple text (e.g. text_outline), render as preformatted text
  if (typeof chartData === 'string' && !chartData.trim().startsWith('graph') && !chartData.trim().startsWith('mindmap')) {
    return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{chartData}</pre>;
  }

  // If chartData is intended for Mermaid
  return <div ref={mermaidRef} className="mermaid-container"></div>;
};

export default MermaidDiagram;

// Example Usage in a component:
// import MermaidDiagram from './MermaidDiagram';
//
// const MyContentPage = ({ visualMap }) => { // visualMap = { format: 'mermaid', data: 'graph TD; A-->B;' }
//   return (
//     <div>
//       <h2>Visual Map</h2>
//       {visualMap && visualMap.data ? (
//         <MermaidDiagram chartData={visualMap.data} diagramId={`topic-${visualMap.topicId}-map`} />
//       ) : (
//         <p>No visual map available.</p>
//       )}
//     </div>
//   );
// };
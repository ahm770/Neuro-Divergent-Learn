import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

const MermaidDiagram = () => {
    const [input, setInput] = useState('graph TD; A-->B');
    const outputRef = useRef(null);

    useEffect(() => {
        // Initialize Mermaid
        mermaid.initialize({ startOnLoad: true });

        // Optional: Ensure Mermaid is loaded, you might want to dynamically load the library
        // and only execute this effect once the library is confirmed to be loaded.
    }, []);

    async function renderDiagram() {
        if (outputRef.current && input) {
            try {
                const { svg } = await mermaid.render("theGraph", input);
                outputRef.current.innerHTML = svg;
            } catch (error) {
                outputRef.current.innerHTML = "Invalid syntax";
            }
        }
    }

    useEffect(() => {
        renderDiagram();
    }, [input]);

    return (
        <div>
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ width: '100%', minHeight: '100px' }}
            />
            <div ref={outputRef} />
        </div>
    );
};

export default MermaidDiagram;
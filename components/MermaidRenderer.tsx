
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  code: string;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter',
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code || !containerRef.current) return;
      
      try {
        setError(null);
        // Remove markdown backticks if they exist
        const cleanCode = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanCode);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram. Please check the Mermaid syntax.');
      }
    };

    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        <p className="font-medium flex items-center gap-2">
          <i className="fas fa-exclamation-triangle"></i> Rendering Error
        </p>
        <p className="text-sm mt-1">{error}</p>
        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">{code}</pre>
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex justify-center">
      <div 
        ref={containerRef} 
        className="mermaid-container"
        dangerouslySetInnerHTML={{ __html: svg }} 
      />
    </div>
  );
};

export default MermaidRenderer;

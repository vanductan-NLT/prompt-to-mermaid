
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
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter',
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        useMaxWidth: true
      }
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code) return;
      
      try {
        setError(null);
        // Remove markdown backticks if they exist
        let cleanCode = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        
        // Remove %% Styling comment which can sometimes cause issues if empty
        cleanCode = cleanCode.replace(/%%\s*Styling\s*$/gm, '');

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Validate syntax before rendering
        const isValid = await mermaid.parse(cleanCode);
        if (isValid) {
          const { svg } = await mermaid.render(id, cleanCode);
          setSvg(svg);
        }
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        setError(err.message || 'Failed to render diagram. Please check the Mermaid syntax.');
      }
    };

    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div className="w-full p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <i className="fas fa-bug text-red-600"></i>
          </div>
          <h3 className="font-bold">Syntax Error Detected</h3>
        </div>
        <div className="bg-white border border-red-100 rounded-lg p-3 mb-4 text-xs font-mono overflow-x-auto max-h-40">
          {error}
        </div>
        <p className="text-sm mb-3">The AI generated invalid Mermaid syntax. Try asking it to "Fix the syntax error" or "Simplify the labels".</p>
        <div className="bg-slate-900 text-slate-400 p-3 rounded-lg text-[10px] font-mono overflow-x-auto">
          <pre>{code}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-center min-h-[200px]">
      {svg ? (
        <div 
          ref={containerRef} 
          className="mermaid-container w-full flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }} 
        />
      ) : (
        <div className="flex items-center gap-3 text-slate-400">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Rendering diagram...</span>
        </div>
      )}
    </div>
  );
};

export default MermaidRenderer;

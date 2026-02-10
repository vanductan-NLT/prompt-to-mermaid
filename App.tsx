
import React, { useState, useRef, useEffect } from 'react';
import { InteractionStep, ChatMessage, AppState } from './types';
import { processUserMessage } from './services/geminiService';
import MermaidRenderer from './components/MermaidRenderer';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: InteractionStep.INPUT,
    messages: [
      {
        id: 'welcome',
        role: 'bot',
        content: 'Hi! I am your Mermaid Flowchart Generator. Describe a workflow or system design (e.g., "A CI/CD pipeline for a mobile app") and I will generate the diagram for you!',
        timestamp: new Date()
      }
    ],
    isLoading: false,
    currentMermaidCode: null
  });

  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const handleSend = async () => {
    if (!input.trim() || state.isLoading) return;
    if (state.step === InteractionStep.COMPLETE) {
      const resetMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'bot',
        content: 'Session complete. Start new for another flow.',
        timestamp: new Date()
      };
      setState(prev => ({ ...prev, messages: [...prev.messages, resetMsg] }));
      setInput('');
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const newMessages = [...state.messages, userMsg];
    setState(prev => ({ ...prev, messages: newMessages, isLoading: true }));
    setInput('');

    try {
      const result = await processUserMessage(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        state.step
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: result.response,
        mermaidCode: result.mermaidCode,
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        step: result.nextStep as InteractionStep,
        messages: [...prev.messages, botMsg],
        currentMermaidCode: result.mermaidCode || prev.currentMermaidCode,
        isLoading: false
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        messages: [...prev.messages, {
          id: 'error',
          role: 'bot',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date()
        }]
      }));
    }
  };

  const startNewSession = () => {
    setState({
      step: InteractionStep.INPUT,
      messages: [
        {
          id: 'welcome',
          role: 'bot',
          content: 'Hi! I am your Mermaid Flowchart Generator. Describe a workflow or system design!',
          timestamp: new Date()
        }
      ],
      isLoading: false,
      currentMermaidCode: null
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Sidebar / Chat History */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-10">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <i className="fas fa-project-diagram text-2xl"></i>
            <h1 className="font-bold text-lg">Mermaid Bot</h1>
          </div>
          <button 
            onClick={startNewSession}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Start New Session"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Session Progress</span>
            <span className="text-xs font-medium text-indigo-600">Step {Math.min(state.step, 3)}/3</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${(Math.min(state.step, 3) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {state.messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 border border-slate-200 text-slate-800'
              }`}>
                {msg.content}
                <div className={`text-[10px] mt-1 opacity-60 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {state.isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={state.step === InteractionStep.COMPLETE ? "Session complete..." : "Type description..."}
              disabled={state.isLoading || state.step === InteractionStep.COMPLETE}
              className="w-full pl-4 pr-12 py-3 bg-slate-100 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm outline-none text-slate-900 placeholder-slate-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={state.isLoading || !input.trim() || state.step === InteractionStep.COMPLETE}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 transition-colors"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
          <p className="text-[10px] text-center mt-2 text-slate-400 font-medium">
            Powered by Gemini 3 Flash • Vietnamese & English
          </p>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 bg-slate-50 overflow-hidden flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <i className="fas fa-eye"></i>
            </span>
            <h2 className="font-semibold text-slate-800">Diagram Preview</h2>
          </div>
          
          {state.currentMermaidCode && (
            <div className="flex gap-2">
               <button 
                onClick={() => {
                  navigator.clipboard.writeText(state.currentMermaidCode || '');
                }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-all shadow-sm flex items-center gap-2"
              >
                <i className="fas fa-copy"></i> Copy Code
              </button>
            </div>
          )}
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {state.currentMermaidCode ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <MermaidRenderer code={state.currentMermaidCode} />
              
              <div className="bg-slate-900 text-slate-300 rounded-xl p-4 font-mono text-xs overflow-x-auto shadow-xl border border-slate-800">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                  <span className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Mermaid Syntax</span>
                  <span className="text-indigo-400">Optimized for Draw.io</span>
                </div>
                <pre className="text-slate-200">{state.currentMermaidCode}</pre>
              </div>
              
              <div className="bg-white border border-indigo-100 p-4 rounded-xl flex items-start gap-4 shadow-sm">
                <div className="p-2 bg-indigo-50 rounded-full">
                  <i className="fas fa-info-circle text-indigo-500"></i>
                </div>
                <div className="text-sm text-slate-700">
                  <p className="font-bold text-slate-900 mb-1">How to use in Draw.io:</p>
                  <ol className="list-decimal ml-4 space-y-1 text-slate-600">
                    <li>Copy the code block above.</li>
                    <li>In Draw.io, click the <strong>+ (Insert)</strong> button.</li>
                    <li>Choose <strong>Advanced</strong> &gt; <strong>Mermaid...</strong></li>
                    <li>Paste the code and click <strong>Insert</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6">
              <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 relative group transition-all hover:scale-105">
                <i className="fas fa-diagram-project text-5xl text-slate-200 group-hover:text-indigo-100 transition-colors"></i>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-sparkles text-sm"></i>
                </div>
              </div>
              <div className="text-center max-w-sm">
                <p className="font-bold text-slate-800 text-lg">No diagram generated yet</p>
                <p className="text-slate-500 mt-2">Describe your workflow or architecture in the chat to see the magic happen.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;

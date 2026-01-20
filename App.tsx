import React, { useState, useEffect } from 'react';
import LoginStep from './components/LoginStep';
import DashboardStep from './components/DashboardStep';
import SouvenirStep from './components/SouvenirStep';
import { UserSession, TripStatus } from './types';
import { clearGeminiCache, setApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [isKeyPanelOpen, setIsKeyPanelOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('GEMINI_API_KEY') || '';
    if (stored) {
      setApiKeyInput(stored);
      setApiKeySaved(true);
      setApiKey(stored);
      setIsKeyPanelOpen(false);
    } else {
      setIsKeyPanelOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!cacheCleared) return;
    const timeout = setTimeout(() => setCacheCleared(false), 1500);
    return () => clearTimeout(timeout);
  }, [cacheCleared]);

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
  };

  // Render logic based on session status
  const renderStep = () => {
    if (!session) {
      return <LoginStep onLoginSuccess={handleLoginSuccess} />;
    }

    switch (session.status) {
      case TripStatus.UPCOMING:
        // For MVP, treating upcoming similar to Dashboard but maybe restricted, 
        // or for this demo, just let them see the dashboard to explore.
        // Or we could show a "Countdown" screen. 
        // Let's reuse Dashboard but maybe with a future tense greeting.
        return <DashboardStep session={session} />;
      
      case TripStatus.DURING_STAY:
        return <DashboardStep session={session} />;
      
      case TripStatus.COMPLETED:
        return <SouvenirStep session={session} />;
      
      default:
        return <LoginStep onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden p-0 sm:p-6 lg:p-8">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
         <img 
            alt="Background" 
            className="w-full h-full object-cover opacity-60 scale-105 blur-sm transition-transform duration-[20s] ease-linear hover:scale-110" 
            src={session?.booking.backgroundImage || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"} 
         />
         <div className="absolute inset-0 bg-black/40 mix-blend-overlay"></div>
      </div>

      <div className="absolute top-4 right-4 z-20 w-[92%] max-w-sm sm:w-auto">
        {isKeyPanelOpen ? (
          <div className="bg-white/95 backdrop-blur-md border border-white/50 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Gemini API Key</div>
              <button
                onClick={() => setIsKeyPanelOpen(false)}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
              >
                Close
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Paste your key here"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => {
                  const key = apiKeyInput.trim();
                  setApiKey(key);
                  setApiKeySaved(!!key);
                  setIsKeyPanelOpen(false);
                }}
                className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
              >
                Save
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  clearGeminiCache();
                  setCacheCleared(true);
                }}
                className="text-[10px] text-slate-600 underline"
              >
                Refresh AI results
              </button>
              {cacheCleared && (
                <span className="text-[10px] text-green-600 font-semibold">Cleared</span>
              )}
            </div>
            <div className="mt-2 text-[10px] text-slate-500">
              Stored locally in your browser. Do not commit to GitHub.
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsKeyPanelOpen(true)}
            className="bg-white/90 backdrop-blur-md border border-white/50 rounded-full px-3 py-2 shadow-lg text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2"
          >
            <span>API Key</span>
            <span className={apiKeySaved ? 'text-green-600' : 'text-amber-600'}>
              {apiKeySaved ? 'Saved' : 'Not set'}
            </span>
          </button>
        )}
      </div>

      {renderStep()}
    </div>
  );
};

export default App;

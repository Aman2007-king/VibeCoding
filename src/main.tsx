import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// ✅ Lazy load the heavy App component
const App = lazy(() => import('./App'));

// Loading fallback while App chunk loads
function AppLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#050505',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '24px', zIndex: 9999
    }}>
      <div style={{
        width: 64, height: 64,
        background: '#10b981',
        borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'bounce 1s ease-in-out infinite'
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2" strokeLinecap="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      </div>
      <div style={{
        width: 200, height: 3,
        background: '#1a1a1a',
        borderRadius: 99, overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', background: '#10b981',
          borderRadius: 99,
          animation: 'load 2s ease-in-out forwards'
        }} />
      </div>
      <div style={{
        color: '#71717a',
        fontFamily: 'system-ui',
        fontSize: 11,
        letterSpacing: '0.3em',
        textTransform: 'uppercase'
      }}>
        Loading Nexus Forge...
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes load {
          0% { width: 0% }
          60% { width: 75% }
          100% { width: 95% }
        }
      `}</style>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<AppLoader />}>
      <App />
    </Suspense>
  </StrictMode>
);

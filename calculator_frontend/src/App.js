import React from 'react';
import './App.css';
import Calculator from './components/Calculator';

// PUBLIC_INTERFACE
function App() {
  /** Root component that renders a centered scientific calculator with responsive layout. */
  return (
    <div className="app-root">
      <main className="container">
        <header className="header">
          <h1 className="title">Scientific Calculator</h1>
          <p className="subtitle">Modern, minimalistic, and responsive</p>
        </header>
        <Calculator />
        <footer className="footer">
          <p className="footer-text">Powered by React • Optional history with Supabase</p>
        </footer>
      </main>
    </div>
  );
}

export default App;

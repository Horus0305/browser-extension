import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AppwriteProvider } from '../../lib/contexts/AppwriteContext';
import { AppProvider } from '../../lib/contexts/AppContext';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppwriteProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AppwriteProvider>
  </React.StrictMode>,
);

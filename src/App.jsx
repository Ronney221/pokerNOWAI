// src/App.jsx
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Register from './Register';
import FullLogUpload from './FullLogUpload';
import Analytics from './Analytics';
import Login from './Login';
import Profile from './Profile';
import VerifyEmail from './VerifyEmail';
import Ledger from './Ledger';
import SavedLedgers from './SavedLedgers';
import SharedLedger from './SharedLedger';
import Bankroll from './Bankroll';
import Home from './Home';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    // Check if we're on the verification page
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('oobCode') && window.location.pathname.includes('/verify-email')) {
      return 'verify-email';
    }
    
    // Check if we're on a shared ledger page (format: /shared-ledger/LEDGER_ID)
    const path = window.location.pathname;
    const sharedLedgerMatch = path.match(/^\/shared-ledger\/([^/]+)$/);
    if (sharedLedgerMatch) {
      return 'shared-ledger';
    }
    
    // Get page from URL path or fallback to home
    const pagePath = path.substring(1).split('/')[0];
    return pagePath || 'home';
  });
  
  // Store ledger ID if we're on a shared ledger page
  const [sharedLedgerId, setSharedLedgerId] = useState(() => {
    const path = window.location.pathname;
    const sharedLedgerMatch = path.match(/^\/shared-ledger\/([^/]+)$/);
    return sharedLedgerMatch ? sharedLedgerMatch[1] : null;
  });

  // Update URL and localStorage when page changes
  useEffect(() => {
    // Don't modify the URL for shared ledger pages as they have a special format
    if (currentPage !== 'shared-ledger') {
      const path = currentPage === 'home' ? '/' : `/${currentPage}`;
      window.history.pushState({}, '', path);
    }
  }, [currentPage]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      
      // Check if we're on a shared ledger page
      const sharedLedgerMatch = path.match(/^\/shared-ledger\/([^/]+)$/);
      if (sharedLedgerMatch) {
        setCurrentPage('shared-ledger');
        setSharedLedgerId(sharedLedgerMatch[1]);
        return;
      }
      
      // Otherwise handle as normal page
      const pagePath = path.substring(1) || 'home';
      setCurrentPage(pagePath);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  let content;
  switch (currentPage) {
    case "home":
      content = <Home setCurrentPage={setCurrentPage} />;
      break;
    case "register":
      content = <Register setCurrentPage={setCurrentPage} />;
      break;
    case "analytics":
      content = <Analytics />;
      break;
    case "ledger":
      content = <Ledger setCurrentPage={setCurrentPage} />;
      break;
    case "saved-ledgers":
      content = <SavedLedgers setCurrentPage={setCurrentPage} />;
      break;
    case "shared-ledger":
      content = <SharedLedger ledgerId={sharedLedgerId} setCurrentPage={setCurrentPage} />;
      break;
    case "bankroll":
      content = <Bankroll />;
      break;
    case "fullLogUpload":
      content = <FullLogUpload />;
      break;
    case "login":
      content = <Login setCurrentPage={setCurrentPage} />;
      break;
    case "profile":
      content = <Profile setCurrentPage={setCurrentPage} />;
      break;
    case "verify-email":
      content = <VerifyEmail setCurrentPage={setCurrentPage} />;
      break;
    default:
      content = <Home setCurrentPage={setCurrentPage} />;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col font-sans">
          <Navbar setCurrentPage={setCurrentPage} />
          <main className="flex-grow">
            {content}
          </main>
          <Footer />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

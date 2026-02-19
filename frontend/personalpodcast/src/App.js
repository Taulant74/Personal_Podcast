

import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from './components/Header';
import EpisodesUpload from './pages/EpisodesUpload';
import HomePage from "./pages/HomePage";
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <style>{`
          html, body { margin: 0; padding: 0; }

          /* ✅ Put the page background here so navbar also sits on it */
          .pp-root{
            min-height:100vh;
            background:
              radial-gradient(1200px 600px at 10% 10%, rgba(99,102,241,.35), transparent 60%),
              radial-gradient(900px 500px at 90% 20%, rgba(34,197,94,.22), transparent 55%),
              radial-gradient(1000px 600px at 60% 95%, rgba(236,72,153,.20), transparent 55%),
              linear-gradient(180deg, #070A13 0%, #0B1024 45%, #070A13 100%);
            color:#e9eefc;
          }

          .pp-container { max-width: 1120px; }

          .pp-topbar{
            background: transparent;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }

          .pp-brand{
            font-weight: 900;
            letter-spacing: -0.2px;
            color: #e9eefc;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }

          .pp-navlink{
            color: rgba(233,238,252,0.75);
            text-decoration: none;
            font-weight: 700;
            position: relative;
            padding: 6px 0;
            transition: color .15s ease;
          }
          .pp-navlink:hover{ color: #ffffff; }
          .pp-navlink::after{
            content:"";
            position:absolute;
            left:0;
            bottom:-6px;
            height:2px;
            width:0%;
            background: linear-gradient(90deg, #6366F1, #22C55E);
            transition: width .2s ease;
            border-radius: 999px;
            opacity: .95;
          }
          .pp-navlink:hover::after{ width: 100%; }

          .pp-chip{
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12);
            color: rgba(233,238,252,0.9);
            border-radius: 999px;
            padding: 6px 10px;
            font-size: 12px;
            display: inline-flex;
            gap: 6px;
            align-items: center;
            white-space: nowrap;
          }
        `}</style>

        <div className="pp-root">
          {/* Header */}
          <Header />

          {/* Faqet */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/episodes" element={<EpisodesUpload />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
);}

export default App;



import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from './components/Header';
import EpisodesUpload from './pages/EpisodesUpload';
import EpisodePage from './pages/EpisodePage';
import HomePage from "./pages/HomePage";
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CategoryPage from './pages/CategoryPage';
import PublisherPage from './pages/PublisherPage';
import { AuthProvider } from './context/AuthContext';
import RequireAdmin from "./components/RequireAdmin";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="pp-root">
          {/* Header */}
          <Header />
          {/* Faqet */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/episodes" element={<EpisodePage />} />
            <Route path="/episode-upload" element={<EpisodesUpload />} />
            <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminDashboard />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/publishers" element={<PublisherPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
);}

export default App;

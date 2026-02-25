import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import EpisodePage from "./pages/EpisodePage";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CategoryPage from "./pages/CategoryPage";
import PublisherDashboard from "./pages/PublisherDashboard";
import { AuthProvider } from "./context/AuthContext";
import UserPanelPage from "./pages/UserPanelPage";
import RequireRole from "./components/RequireRole";
import OrderPage from './pages/OrderPage';
import MyEpisodesPage from './pages/MyEpisodesPage';
import AboutPage from "./pages/AboutPage";
import HelpPage from "./pages/HelpPage";

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
            <Route path="/order/:episodeId" element={<OrderPage />} />
            <Route path="/user-panel" element={<UserPanelPage />} />
            <Route path="/my-episodes" element={<MyEpisodesPage />} />
            <Route path="/episodes" element={<EpisodePage />} />
            <Route element={<RequireRole allowedRoles={["Admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route
              element={<RequireRole allowedRoles={["Publisher", "Admin"]} />}
            >
              <Route path="/publisher" element={<PublisherDashboard />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
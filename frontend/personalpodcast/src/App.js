import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import EpisodePage from "./pages/EpisodePage";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PublisherDashboard from "./pages/PublisherDashboard/PublisherDashboard";
import { AuthProvider } from "./context/AuthContext";
import UserPanelPage from "./pages/UserPanelPage";
import RequireRole from "./components/RequireRole";
import OrderPage from './pages/OrderPage';
import MyEpisodesPage from './pages/MyEpisodesPage';
import AboutPage from "./pages/AboutPage/AboutPage";
import HelpPage from "./pages/HelpPage/HelpPage";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import NoPage from "./pages/NoPage";
import Footer from "./components/Footer";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="pp-root">
          {/* Header */}
          <Header />
          {/* Faqet */}
          <Routes>

            {/* Loggedin ose Logged Out */}
            <Route path="/" element={<HomePage />} />
            <Route path="/order/:episodeId" element={<OrderPage />} />
            <Route path="/episodes" element={<EpisodePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />

            <Route path="/*" element={<NoPage />} />

            {/* Loggedin paqare */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RequireRole allowedRoles={["Admin"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
              <Route
                element={<RequireRole allowedRoles={["Publisher", "Admin"]} />}
              >
                <Route path="/publisher" element={<PublisherDashboard />} />
              </Route>
              <Route path="/user-panel" element={<UserPanelPage />} />
              <Route path="/my-episodes" element={<MyEpisodesPage />} />
            </Route>

            {/* Logged out paqare */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
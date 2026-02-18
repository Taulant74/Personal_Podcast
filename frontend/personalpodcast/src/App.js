import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import EpisodesUpload from './pages/EpisodesUpload';

function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Podcast Platform Test</h2>
      <p>Welcome to the homepage.</p>
      <Link to="/episodes">Go to Upload & Search Episodes</Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div>
        <nav style={{ padding: 10, background: "#f5f5f5" }}>
          <Link to="/" style={{ marginRight: 15 }}>Home</Link>
          <Link to="/episodes">Episodes</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/episodes" element={<EpisodesUpload />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

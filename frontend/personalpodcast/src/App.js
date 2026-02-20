import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import EpisodesUpload from './pages/EpisodesUpload';
import HomePage from "./pages/HomePage";

import AdminDashboard from './pages/AdminDashboard';
import Layout from './layout/layout';


function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/episodes" element={<EpisodesUpload />} />
          <Route path="/admin" element={<AdminDashboard />} />

        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

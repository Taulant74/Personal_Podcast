import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://localhost:7261/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Use the login function from context which handles token storage and state
        login(data.AccessToken);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Login</h1>
          <p className="text-gray-300 mb-6">Welcome back to Personal Podcast</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
                placeholder="Enter your username or email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-green-500 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-green-600 disabled:opacity-50 transition"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-gray-300 text-center mt-6">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

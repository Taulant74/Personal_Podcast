import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://localhost:7261/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Use the login function from context which handles token storage and state
        login(data.AccessToken);
        navigate('/');
      } else {
        setError(data.message || 'Registration failed');
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
          <h1 className="text-3xl font-bold text-white mb-2">Sign Up</h1>
          <p className="text-gray-300 mb-6">Create your Personal Podcast account</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
                placeholder="Choose a username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
                placeholder="Your first name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
                placeholder="Your last name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition"
                placeholder="At least 8 characters, 1 letter, 1 number"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Password must be at least 8 characters with at least one letter and one number
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-green-500 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-green-600 disabled:opacity-50 transition"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-gray-300 text-center mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;

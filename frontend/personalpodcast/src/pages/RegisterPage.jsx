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
  const { login, isLoggedIn } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  React.useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
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
        login(data.accessToken);
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
    <div className="min-vh-100 d-flex align-items-center justify-content-center px-4">
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <div className="card text-white p-4 rounded-4 shadow-lg" style={{ backgroundColor: "#44444E" }}>
          <div className="card-body">
            <h1 className="card-title mb-2">Sign Up</h1>
            <p className="card-text mb-4">Create your Personal Podcast account</p>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="form-control bg-secondary text-white"
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="form-control bg-secondary text-white"
                  placeholder="Your first name"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="form-control bg-secondary text-white"
                  placeholder="Your last name"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-control bg-secondary text-white"
                  placeholder="At least 8 characters, 1 letter, 1 number"
                  required
                />
                <div className="form-text text-white">
                  Password must be at least 8 characters with at least one letter and one number
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <p className="text-center mt-4 mb-0">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="btn btn-link text-white p-0"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;

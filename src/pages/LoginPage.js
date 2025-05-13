import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../App.css';

const LoginPage = ({ setIsAuthenticated }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const apiBaseUrl = 'http://localhost:8000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Login failed');
        return;
      }

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('username', data.user.username);

      setIsAuthenticated(true);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again later.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setRegisterSuccess('');
    setIsLoading(true);

    if (regData.password !== regData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regData.fullName,
          email: regData.email,
          username: regData.username,
          password: regData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      setRegisterSuccess('User registered successfully! You can now log in.');
      setRegData({
        fullName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    setRegData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isRegistering ? 'Register' : 'Login'} to Payslip Processor</h2>

        {isRegistering ? (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Full Name:</label>
              <input 
                type="text" 
                name="fullName" 
                value={regData.fullName} 
                onChange={handleRegChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input 
                type="email" 
                name="email" 
                value={regData.email} 
                onChange={handleRegChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Username:</label>
              <input 
                type="text" 
                name="username" 
                value={regData.username} 
                onChange={handleRegChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={regData.password}
                  onChange={handleRegChange}
                  required
                  minLength="6"
                />
                <span onClick={() => setShowPassword(!showPassword)} className="eye-icon">
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </span>
              </div>
            </div>
            <div className="form-group">
              <label>Confirm Password:</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={regData.confirmPassword}
                  onChange={handleRegChange}
                  required
                  minLength="6"
                />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="eye-icon">
                  {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                </span>
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            {registerSuccess && <div className="success-message">{registerSuccess}</div>}
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </button>
            <p style={{ marginTop: '10px' }}>
              Already have an account?{' '}
              <span className="link" onClick={() => {
                setIsRegistering(false);
                setError('');
              }}>
                Login here
              </span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username:</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span onClick={() => setShowPassword(!showPassword)} className="eye-icon">
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </span>
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}
            {registerSuccess && <div className="success-message">{registerSuccess}</div>}
            <button type="submit" className="login-btn">Login</button>
            <p style={{ marginTop: '10px' }}>
              Don't have an account?{' '}
              <span className="link" onClick={() => {
                setIsRegistering(true);
                setError('');
                setRegisterSuccess('');
              }}>
                Register here
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
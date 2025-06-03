import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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
  const apiBaseUrl = 'https://backend2-2szh.onrender.com';

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
      localStorage.setItem('user', JSON.stringify(data.user));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated blur circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-100 rounded-full filter blur-2xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-100 rounded-full filter blur-2xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-slate-100 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 z-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-center text-gray-600 mb-6">
          {isRegistering ? 'Join Payslip Processor today' : 'Sign in to your account'}
        </p>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          {isRegistering && (
            <>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={regData.fullName}
                onChange={handleRegChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={regData.email}
                onChange={handleRegChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={regData.username}
                onChange={handleRegChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </>
          )}

          {!isRegistering && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          )}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name={isRegistering ? 'password' : undefined}
              placeholder="Password"
              value={isRegistering ? regData.password : password}
              onChange={isRegistering ? handleRegChange : (e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {isRegistering && (
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={regData.confirmPassword}
                onChange={handleRegChange}
                required
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          )}

          {error && <div className="text-red-600 bg-red-100 border border-red-300 px-4 py-2 rounded">{error}</div>}
          {registerSuccess && <div className="text-green-600 bg-green-100 border border-green-300 px-4 py-2 rounded">{registerSuccess}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all"
          >
            {isLoading ? (isRegistering ? 'Registering...' : 'Logging in...') : (isRegistering ? 'Register' : 'Login')}
          </button>
        </form>

        <div className="text-center mt-4 text-gray-600">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}
          <button
            className="ml-2 text-blue-600 hover:text-blue-800 font-semibold underline"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setRegisterSuccess('');
              setUsername('');
              setPassword('');
              setRegData({
                fullName: '',
                email: '',
                username: '',
                password: '',
                confirmPassword: ''
              });
            }}
          >
            {isRegistering ? 'Sign in' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './Components/Navbars';
import Dashboard from './pages/Dashboards';
import UploadPage from './pages/UploadPage';
import RecordsPage from './pages/RecordsPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    };

    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  return (
    <Router>
      {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
      <Routes>
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to="/" />
            : <LoginPage setIsAuthenticated={setIsAuthenticated} />
        } />
        <Route path="/" element={
          isAuthenticated
            ? <Dashboard />
            : <Navigate to="/login" />
        } />
        <Route path="/upload" element={
          isAuthenticated
            ? <UploadPage />
            : <Navigate to="/login" />
        } />
        <Route path="/records" element={
          isAuthenticated
            ? <RecordsPage />
            : <Navigate to="/login" />
        } />
        <Route path="/reports" element={
          isAuthenticated
            ? <ReportsPage />
            : <Navigate to="/login" />
        } />
        <Route path="/profile" element={
          isAuthenticated
            ? <ProfilePage />
            : <Navigate to="/login" />
        } />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
};

export default App;

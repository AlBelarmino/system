import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

const Navbar = ({ setIsAuthenticated }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false); // update state
    navigate('/login'); // navigate to login
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2 className="system-name">AutoPayslip</h2>
      </div>

      <div className="navbar-rights">
        <Link to="/" className="nav-link">Dashboard</Link>
        <Link to="/Upload" className="nav-link">Scan DTR</Link>
        <Link to="/Reports" className="nav-link">Print Payslip</Link>
        <Link to="/records" className="nav-link">Records</Link>

        {/* Profile Dropdown Trigger */}
        <div className="profile-dropdown">
          <button
            className="nav-link profile-trigger"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            Profile ▾
          </button>

          {showProfileDropdown && (
            <div className="profile-dropdown-menu">
              <Link to="/Profile" className="dropdown-item">Payroll Profile</Link>
              <Link to="/settings" className="dropdown-item">Settings</Link>
              <button className="dropdown-item" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

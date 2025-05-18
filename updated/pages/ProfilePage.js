import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const ProfilePage = () => {
  // Use camelCase keys to match backend payload
  const [userData, setUserData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    employmentType: 'regular',
    baseSalaryPerHour: 0,
    sssDeduction: 0,
    pagibigDeduction: 0,
    philhealthDeduction: 0,
    taxDeduction: 0,
    leaveCredits: 0 

  });

  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const username = localStorage.getItem('username');
        if (!username) {
          setErrorMessage('Username not found');
          setIsLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:8000/api/user/profile', {
          params: { username }
        });

        const profileData = response.data;
        setUserData({
          fullName: profileData.full_name || '',
          username: profileData.username,
          email: profileData.email,
          employmentType: profileData.payrollProfile?.employment_type || 'regular',
          baseSalaryPerHour: profileData.payrollProfile?.baseSalaryPerHour || 0,
          sssDeduction: profileData.payrollProfile?.sssDeduction || 0,
          pagibigDeduction: profileData.payrollProfile?.pagibigDeduction || 0,
          philhealthDeduction: profileData.payrollProfile?.philhealthDeduction || 0,
          taxDeduction: profileData.payrollProfile?.taxDeduction || 0,
          leaveCredits: profileData.payrollProfile?.leaveCredits || 0,
          password: ''
        });

      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setErrorMessage('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For numeric fields, parse as float or default to 0
    const numericFields = [
      'baseSalaryPerHour', 'sssDeduction', 'pagibigDeduction', 'philhealthDeduction', 'taxDeduction','leaveCredits' 
    ];

    setUserData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? (parseFloat(value) || 0) : value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        username: userData.username,
        email: userData.email,
        full_name: userData.fullName,
        payrollProfile: {
          employment_type: userData.employmentType,
          baseSalaryPerHour: userData.baseSalaryPerHour,
          sssDeduction: userData.sssDeduction,
          pagibigDeduction: userData.pagibigDeduction,
          philhealthDeduction: userData.philhealthDeduction,
          taxDeduction: userData.taxDeduction,
          leaveCredits: userData.leaveCredits   // <-- add this
        },
        ...(userData.password && { password: userData.password })
      };

      await axios.put('http://localhost:8000/api/user/profile', payload);

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

      setEditMode(false);
      // Clear password input on success
      setUserData(prev => ({ ...prev, password: '' }));
    } catch (err) {
      console.error('Failed to save profile:', err);
      setErrorMessage(err.response?.data?.detail || 'Failed to update profile');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setErrorMessage('');
  };

  if (isLoading && !editMode) {
    return (
      <div className="payslip-container">
        <div className="loading-spinner">Loading profile data...</div>
      </div>
    );
  }

  return (
    <div className="payslip-container">
      <div className="payslip-header">
        <h1 className="payslip-title">User Profile</h1>
        <p className="employee-info">Manage your account and payroll information</p>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <div className="data-grid">
        <div className="data-row">
          <div className="data-label">Full Name</div>
          <div className="data-value">
            {editMode ? (
              <input
                type="text"
                name="fullName"
                value={userData.fullName}
                onChange={handleInputChange}
                className="form-input"
              />
            ) : (
              userData.fullName || 'Not set'
            )}
          </div>
        </div>

        <div className="data-row">
          <div className="data-label">Username</div>
          <div className="data-value">{userData.username}</div>
        </div>

        <div className="data-row">
          <div className="data-label">Email</div>
          <div className="data-value">
            {editMode ? (
              <input
                type="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                className="form-input"
              />
            ) : (
              userData.email || 'Not set'
            )}
          </div>
        </div>

        <div className="data-row">
          <div className="data-label">Password</div>
          <div className="data-value">
            {editMode ? (
              <input
                type="password"
                name="password"
                value={userData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter new password"
              />
            ) : (
              '••••••••'
            )}
          </div>
        </div>

        <div className="data-row">
          <div className="data-label">Employment Type</div>
          <div className="data-value">
            {editMode ? (
              <select
                name="employmentType"
                value={userData.employmentType}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="regular">Regular</option>
                <option value="irregular">Irregular</option>
              </select>
            ) : (
              userData.employmentType || 'Not set'
            )}
          </div>
        </div>

        <div className="data-row">
          <div className="data-label">Base Salary/Hour</div>
          <div className="data-value">
            {editMode ? (
              <input
                type="number"
                name="baseSalaryPerHour"
                value={userData.baseSalaryPerHour}
                onChange={handleInputChange}
                className="form-input"
                step="0.01"
                min="0"
              />
            ) : (
              `₱${userData.baseSalaryPerHour.toFixed(2)}`
            )}
          </div>
        </div>

        {/* Deduction Fields */}
        {['sssDeduction', 'pagibigDeduction', 'philhealthDeduction', 'taxDeduction'].map((field) => (
          <div className="data-row" key={field}>
            <div className="data-label">
              {field.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
            </div>
            <div className="data-value">
              {editMode ? (
                <input
                  type="number"
                  name={field}
                  value={userData[field]}
                  onChange={handleInputChange}
                  className="form-input"
                  step="0.01"
                  min="0"
                />
              ) : (
                `₱${userData[field].toFixed(2)}`
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="data-row">
        <div className="data-label">Leave Credits</div>
        <div className="data-value">
          {editMode ? (
            <input
              type="number"
              name="leaveCredits"
              value={userData.leaveCredits}
              onChange={handleInputChange}
              className="form-input"
              step="0.01"
              min="0"
            />
          ) : (
            `${userData.leaveCredits.toFixed(2)} day(s)`
          )}
        </div>
      </div>
      <div className="action-buttons">
        {editMode ? (
          <>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          </>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

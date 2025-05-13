import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    employment_type: '',
    base_salary_hour: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // UseEffect to fetch user profile or load from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));  // Load from localStorage
    } else {
      const fetchUserProfile = async () => {
        try {
          const username = localStorage.getItem('username');
          if (!username) {
            setErrorMessage('Username not found in localStorage');
            return;
          }

          const response = await axios.get('http://localhost:8000/api/user/profile', {
            params: { username }
          });

          console.log(response.data);  // Debugging line to check the response

          const userData = {
            full_name: response.data.full_name || '',
            username: response.data.username,
            email: response.data.email,
            employment_type: response.data.employment_type || '',
            base_salary_hour: response.data.base_salary_hour || '',
            password: ''
          };

          setUserData(userData);
          localStorage.setItem('userData', JSON.stringify(userData));  // Save to localStorage
        } catch (err) {
          console.error('Failed to fetch user data:', err);
          setErrorMessage('Failed to load profile data');
        }
      };

      fetchUserProfile();
    }
  }, []);  // Empty array ensures this runs only once on page load

  // Handle input changes in form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle saving the updated profile data
  const handleSave = async () => {
    try {
      const payload = {
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        employment_type: userData.employment_type,
        base_salary_hour: userData.base_salary_hour,
        ...(userData.password && { password: userData.password })
      };

      await axios.put('http://localhost:8000/api/user/profile', payload);

      // Save updated user data in localStorage
      localStorage.setItem('userData', JSON.stringify(userData));

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditMode(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setErrorMessage('Failed to update profile');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

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
                name="full_name"
                value={userData.full_name}
                onChange={handleInputChange}
                className="form-group"
              />
            ) : (
              userData.full_name
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
                className="form-group"
              />
            ) : (
              userData.email
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
                className="form-group"
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
                name="employment_type"
                value={userData.employment_type}
                onChange={handleInputChange}
                className="form-group"
              >
                <option value="regular">Regular</option>
                <option value="irregular">Irregular</option>
              </select>
            ) : (
              userData.employment_type
            )}
          </div>
        </div>

        <div className="data-row">
          <div className="data-label">Base Salary/Hour</div>
          <div className="data-value">
            {editMode ? (
              <input
                type="number"
                name="base_salary_hour"
                value={userData.base_salary_hour}
                onChange={handleInputChange}
                className="form-group"
              />
            ) : (
              `₱${userData.base_salary_hour}`
            )}
          </div>
        </div>
      </div>

      <div className="action-buttons">
        {editMode ? (
          <>
            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => setEditMode(true)}>Edit Profile</button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

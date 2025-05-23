import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    employmentType: 'regular',
    baseSalaryPerHour: 0,
    gsisDeduction: 0,
    philhealthDeduction: 0,
    taxDeduction: 0,
    leaveCredits: 0,
    bonuses: [],  // Changed to match API structure
    loans: [],
    bonusOther: {},  // 👈 Add this
    loanOther: {}      // Changed to match API structure
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

        const { user, payrollProfile, bonuses = [], loans = [] } = response.data;
        // Extract 'other' bonuses and loans if they exist
        const bonusOther = bonuses.find(b => b.bonus_type === 'other') || { bonus_name: '', amount: 0, frequency: 'monthly' };
        const loanOther = loans.find(l => l.loan_type === 'other') || { loan_name: '', amount: 0, start_month: '', start_year: '', duration_months: 0 };

        // Filter out 'other' from main list
        const filteredBonuses = bonuses.filter(b => b.bonus_type !== 'other');
        const filteredLoans = loans.filter(l => l.loan_type !== 'other');

        
        setUserData({
          fullName: user.full_name || '',
          username: user.username || '',
          email: user.email || '',
          password: '',
          employmentType: payrollProfile?.employment_type || 'regular',
          baseSalaryPerHour: payrollProfile?.baseSalaryPerHour || 0,
          gsisDeduction: payrollProfile?.gsisDeduction || 0,
          philhealthDeduction: payrollProfile?.philhealthDeduction || 0,
          taxDeduction: payrollProfile?.taxDeduction || 0,
          leaveCredits: payrollProfile?.leaveCredits || 0,
          bonuses: filteredBonuses,
          loans: filteredLoans,
          bonusOther: {
            name: bonusOther.bonus_name || '',
            amount: bonusOther.amount || 0,
            frequency: bonusOther.frequency || 'monthly'
          },
          loanOther: {
            name: loanOther.loan_name || '',
            amount: loanOther.amount || 0,
            startMonth: loanOther.start_month || '',
            startYear: loanOther.start_year || '',
            durationMonths: loanOther.duration_months || 0
          }});
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
    const numericFields = ['baseSalaryPerHour', 'gsisDeduction', 'philhealthDeduction', 'taxDeduction', 'leaveCredits'];
    setUserData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? (parseFloat(value) || 0) : value
    }));
  };

const handleSave = async () => {
  setIsLoading(true);
  try {
    // Filter out invalid loans and bonuses
    const validLoans = userData.loans.filter(
      loan => loan.name && loan.amount > 0 && loan.startMonth && loan.startYear
    );

    const validBonuses = userData.bonuses.filter(
      bonus => bonus.name && bonus.amount > 0 && bonus.type
    );

    // Prepare the payload
    const payload = {
      username: userData.username,
      email: userData.email,
      full_name: userData.fullName,
      payrollProfile: {
        employment_type: userData.employmentType,
        baseSalaryPerHour: userData.baseSalaryPerHour,
        gsisDeduction: userData.gsisDeduction,
        philhealthDeduction: userData.philhealthDeduction,
        taxDeduction: userData.taxDeduction,
        leaveCredits: userData.leaveCredits,
        bonuses: validBonuses,
        loans: validLoans,
        bonusOther: userData.bonusOther?.name ? userData.bonusOther : null,
        loanOther: userData.loanOther?.name ? userData.loanOther : null
      }
    };

    // Only include password if it's not empty
    if (userData.password) {
      payload.password = userData.password;
    }

    await axios.put('http://localhost:8000/api/user/profile', payload);
    
    setSuccessMessage('Profile updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    setEditMode(false);
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
        {/* Standard Fields */}
        <div className="data-row"><div className="data-label">Full Name</div>
          <div className="data-value">
            {editMode ? <input name="fullName" value={userData.fullName} onChange={handleInputChange} className="form-input" /> : userData.fullName || 'Not set'}
          </div>
        </div>

        <div className="data-row"><div className="data-label">Username</div><div className="data-value">{userData.username}</div></div>

        <div className="data-row"><div className="data-label">Email</div>
          <div className="data-value">
            {editMode ? <input name="email" value={userData.email} onChange={handleInputChange} className="form-input" /> : userData.email || 'Not set'}
          </div>
        </div>

        <div className="data-row"><div className="data-label">Password</div>
          <div className="data-value">
            {editMode ? <input name="password" type="password" value={userData.password} onChange={handleInputChange} className="form-input" placeholder="Enter new password" /> : '••••••••'}
          </div>
        </div>

        <div className="data-row"><div className="data-label">Employment Type</div>
          <div className="data-value">
            {editMode ? (
              <select name="employmentType" value={userData.employmentType} onChange={handleInputChange} className="form-input">
                <option value="regular">Regular</option>
                <option value="irregular">Irregular</option>
              </select>
            ) : userData.employmentType}
          </div>
        </div>

        <div className="data-row"><div className="data-label">Base Salary/Hour</div>
          <div className="data-value">
            {editMode ? (
              <input name="baseSalaryPerHour" type="number" step="0.01" value={userData.baseSalaryPerHour} onChange={handleInputChange} className="form-input" />
            ) : `₱${userData.baseSalaryPerHour.toFixed(2)}`}
          </div>
        </div>

        {['gsisDeduction', 'philhealthDeduction', 'taxDeduction'].map(field => (
          <div className="data-row" key={field}>
            <div className="data-label">{field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</div>
            <div className="data-value">
              {editMode ? (
                <input name={field} type="number" value={userData[field]} onChange={handleInputChange} className="form-input" step="0.01" />
              ) : `₱${userData[field].toFixed(2)}`}
            </div>
          </div>
        ))}

        <div className="data-row"><div className="data-label">Leave Credits</div>
          <div className="data-value">
            {editMode ? (
              <input name="leaveCredits" type="number" value={userData.leaveCredits} onChange={handleInputChange} className="form-input" step="0.01" />
            ) : `${userData.leaveCredits.toFixed(2)} day(s)`}
          </div>
        </div>

        {/* Bonuses Section */}
<div className="data-row">
  <div className="data-label">Bonuses</div>
  <div className="data-value">
    {editMode ? (
      <>
        {['13th Month Pay', 'Christmas Bonus', 'Mid-Year Bonus'].map((bonusType) => {
          const existingBonus = userData.bonuses.find(b => b.type === bonusType);
          const isChecked = !!existingBonus;

          const handleBonusCheckbox = () => {
            if (isChecked) {
              // Remove bonus from array
              setUserData(prev => ({
                ...prev,
                bonuses: prev.bonuses.filter(b => b.type !== bonusType)
              }));
            } else {
              // Add new bonus object with defaults
              setUserData(prev => ({
                ...prev,
                bonuses: [...prev.bonuses, { type: bonusType, name: bonusType, amount: 0, frequency: 'yearly' }]
              }));
            }
          };

          const handleBonusChange = (field, value) => {
            setUserData(prev => ({
              ...prev,
              bonuses: prev.bonuses.map(b =>
                b.type === bonusType ? { ...b, [field]: field === 'amount' ? parseFloat(value) || 0 : value } : b
              )
            }));
          };

          return (
            <div key={bonusType} style={{ marginBottom: '8px' }}>
              <label>
                <input type="checkbox" checked={isChecked} onChange={handleBonusCheckbox} /> {bonusType}
              </label>
              {isChecked && (
                <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                  <input
                    type="text"
                    value={existingBonus.name}
                    onChange={e => handleBonusChange('name', e.target.value)}
                    placeholder="Bonus Name"
                    className="form-input"
                  />
                  <input
                    type="number"
                    value={existingBonus.amount}
                    onChange={e => handleBonusChange('amount', e.target.value)}
                    placeholder="Amount"
                    className="form-input"
                  />
                  <select
                    value={existingBonus.frequency}
                    onChange={e => handleBonusChange('frequency', e.target.value)}
                    className="form-input"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
            </div>
          );
        })}

        {/* Bonus Others */}
        <div>
          <label>
            <input
              type="checkbox"
              checked={!!userData.bonusOther.name}
              onChange={(e) => {
                if (e.target.checked) {
                  setUserData(prev => ({ ...prev, bonusOther: { name: '', amount: 0, frequency: 'monthly' } }));
                } else {
                  setUserData(prev => ({ ...prev, bonusOther: {} }));
                }
              }}
            /> Others
          </label>
          {userData.bonusOther.name !== undefined && (
            <div style={{ marginLeft: '20px', marginTop: '4px' }}>
              <input
                type="text"
                placeholder="Bonus Name"
                value={userData.bonusOther.name}
                onChange={e => setUserData(prev => ({ ...prev, bonusOther: { ...prev.bonusOther, name: e.target.value } }))}
                className="form-input"
              />
              <input
                type="number"
                placeholder="Amount"
                value={userData.bonusOther.amount}
                onChange={e => setUserData(prev => ({ ...prev, bonusOther: { ...prev.bonusOther, amount: parseFloat(e.target.value) || 0 } }))}
                className="form-input"
              />
              <select
                value={userData.bonusOther.frequency}
                onChange={e => setUserData(prev => ({ ...prev, bonusOther: { ...prev.bonusOther, frequency: e.target.value } }))}
                className="form-input"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
        </div>
      </>
    ) : (
      <>
        {userData.bonuses.map(b => (
          <div key={b.type}>
            {b.name} - ₱{b.amount.toFixed(2)} ({b.frequency})
          </div>
        ))}
        {userData.bonusOther?.name && (
          <div>Other: {userData.bonusOther.name} - ₱{userData.bonusOther.amount.toFixed(2)} ({userData.bonusOther.frequency})</div>
        )}
      </>
    )}
  </div>
</div>

{/* Loans Section */}
<div className="data-row">
  <div className="data-label">Loans</div>
  <div className="data-value">
    {editMode ? (
      <>
        {['Calamity Loan', 'Emergency Loan', 'GSIS Loan'].map((loanType) => {
          const existingLoan = userData.loans.find(l => l.type === loanType);
          const isChecked = !!existingLoan;

          const startDate = existingLoan && existingLoan.startMonth && existingLoan.startYear
            ? `${existingLoan.startYear}-${existingLoan.startMonth.padStart(2, '0')}`
            : '';

          const handleLoanCheckbox = () => {
            if (isChecked) {
              setUserData(prev => ({
                ...prev,
                loans: prev.loans.filter(l => l.type !== loanType)
              }));
            } else {
              setUserData(prev => ({
                ...prev,
                loans: [...prev.loans, {
                  type: loanType,
                  name: loanType,
                  amount: 0,
                  startMonth: '',
                  startYear: '',
                  durationMonths: 0
                }]
              }));
            }
          };

          const handleLoanChange = (field, value) => {
            if (field === 'startDate') {
              const [year, month] = value.split('-');
              setUserData(prev => ({
                ...prev,
                loans: prev.loans.map(l =>
                  l.type === loanType ? { ...l, startYear: parseInt(year, 10), startMonth: month } : l
                )
              }));
            } else {
              setUserData(prev => ({
                ...prev,
                loans: prev.loans.map(l =>
                  l.type === loanType ? {
                    ...l,
                    [field]: field === 'amount' || field === 'durationMonths' ? parseFloat(value) || 0 : value
                  } : l
                )
              }));
            }
          };

          return (
            <div key={loanType} style={{ marginBottom: '8px' }}>
              <label>
                <input type="checkbox" checked={isChecked} onChange={handleLoanCheckbox} /> {loanType}
              </label>
              {isChecked && (
                <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                  <input
                    type="text"
                    value={existingLoan.name}
                    onChange={e => handleLoanChange('name', e.target.value)}
                    placeholder="Loan Name"
                    className="form-input"
                  />
                  <input
                    type="number"
                    value={existingLoan.amount}
                    onChange={e => handleLoanChange('amount', e.target.value)}
                    placeholder="Amount"
                    className="form-input"
                  />
                  <input
                    type="month"
                    value={startDate}
                    onChange={e => handleLoanChange('startDate', e.target.value)}
                    className="form-input"
                  />
                  <input
                    type="number"
                    placeholder="Duration (months)"
                    value={existingLoan.durationMonths || ''}
                    onChange={e => handleLoanChange('durationMonths', e.target.value)}
                    className="form-input"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Loan Others */}
        <div>
          <label>
            <input
              type="checkbox"
              checked={!!userData.loanOther.name}
              onChange={(e) => {
                if (e.target.checked) {
                  setUserData(prev => ({
                    ...prev,
                    loanOther: {
                      name: '',
                      amount: 0,
                      startDate: '',
                      durationMonths: 0
                    }
                  }));
                } else {
                  setUserData(prev => ({ ...prev, loanOther: {} }));
                }
              }}
            /> Others
          </label>
          {userData.loanOther.name !== undefined && (
            <div style={{ marginLeft: '20px', marginTop: '4px' }}>
              <input
                type="text"
                placeholder="Loan Name"
                value={userData.loanOther.name}
                onChange={e =>
                  setUserData(prev => ({
                    ...prev,
                    loanOther: { ...prev.loanOther, name: e.target.value }
                  }))
                }
                className="form-input"
              />
              <input
                type="number"
                placeholder="Amount"
                value={userData.loanOther.amount}
                onChange={e =>
                  setUserData(prev => ({
                    ...prev,
                    loanOther: { ...prev.loanOther, amount: parseFloat(e.target.value) || 0 }
                  }))
                }
                className="form-input"
              />
              <input
                type="month"
                placeholder="Start Date"
                value={userData.loanOther.startDate || ''}
                onChange={e =>
                  setUserData(prev => ({
                    ...prev,
                    loanOther: { ...prev.loanOther, startDate: e.target.value }
                  }))
                }
                className="form-input"
              />
              <input
                type="number"
                placeholder="Duration (months)"
                value={userData.loanOther.durationMonths || ''}
                onChange={e =>
                  setUserData(prev => ({
                    ...prev,
                    loanOther: { ...prev.loanOther, durationMonths: parseInt(e.target.value) || 0 }
                  }))
                }
                className="form-input"
              />
            </div>
          )}
        </div>
      </>
    ) : (
      <>
        {userData.loans.map(l => (
          <div key={l.type}>
            {l.loan_name} - ₱{l.amount.toFixed(2)}
            {(l.start_month && l.start_year && parseInt(l.start_ear) !== 0) ? (
              <> (Start: {l.start_month} / {l.start_year})</>
            ) : (
              <> (Start: N/A)</>
            )}
            {l.duration_months ? <> (Duration: {l.duration_months} months)</> : ''}
          </div>
        ))}
        {userData.loanOther?.name && (
          <div>
            Other: {userData.loanOther.name} - ₱{userData.loanOther.amount.toFixed(2)}
            {userData.loanOther.startDate ? (
              <> (Start: {userData.loanOther.startDate.replace('-', ' / ')})</>
            ) : (
              <> (Start: N/A)</>
            )}
            {userData.loanOther.durationMonths ? <> (Duration: {userData.loanOther.durationMonths} months)</> : ''}
          </div>
        )}
      </>
    )}
  </div>
</div>

      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        {editMode ? (
          <>
            <button className="btn btn-primary" onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn btn-secondary" onClick={handleCancel} disabled={isLoading}>Cancel</button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => setEditMode(true)}>Edit Profile</button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

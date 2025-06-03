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
    salaryGrade: '12',           
    baseMonthlySalary: 32000,
    baseSalaryPerHour: 0,
    gsisDeduction: 0,
    philhealthDeduction: 0,
    taxDeduction: 0,
    leaveCredits: 0,
    bonuses: [],
    loans: [],
    bonusOther: {},
    loanOther: {}
  });

  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
   
  const salaryGrades = {
      12: 32000,
      13: 34500,
      14: 37000,
      15: 39500,
      16: 42000,
      17: 44500,
      18: 47000,
      19: 49500,
      20: 52000,
    };

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

        console.log('Fetching profile for username:', username);
        const response = await axios.get('https://backend2-2szh.onrender.com/api/user/profile', {
          params: { username }
        });

        console.log('API Response Data:', response.data);
        
        const { user, payrollProfile, bonuses = [], loans = [] } = response.data;

        console.log('Raw Loans Data:', loans);

        const bonusOtherRaw = bonuses.find(b => b.bonus_type === 'other') || {};
        const loanOtherRaw = loans.find(l => l.loan_type === 'other') || {};

        const filteredBonuses = bonuses
          .filter(b => b.bonus_type !== 'other')
          .map(b => ({
            type: b.bonus_type,
            name: b.bonus_name,
            amount: parseFloat(b.amount) || 0,
            frequency: b.frequency || 'yearly'
          }));

        const filteredLoans = loans
        .filter(l => l.loan_type !== 'other')
        .map(l => {

          return {
            type: l.loan_type,
            name: l.loan_name,
            amount: parseFloat(l.amount) || 0,
            startMonth: l.start_month,
            startYear: l.start_year,
            durationMonths: l.duration_months,
          };
        });

        console.log('Processed Loans:', filteredLoans);

        setUserData({
          fullName: user.full_name || '',
          username: user.username || '',
          email: user.email || '',
          password: '',
          employmentType: payrollProfile?.employment_type || 'regular',
          salaryGrade: payrollProfile?.salaryGrade || '12',
          baseMonthlySalary: payrollProfile?.baseMonthlySalary || 0,
          baseSalaryPerHour: payrollProfile?.baseSalaryPerHour || 0,
          gsisDeduction: payrollProfile?.gsisDeduction || 0,
          philhealthDeduction: payrollProfile?.philhealthDeduction || 0,
          taxDeduction: payrollProfile?.taxDeduction || 0,
          leaveCredits: payrollProfile?.leaveCredits || 0,
          bonuses: filteredBonuses,
          loans: filteredLoans,
          bonusOther: {
            name: bonusOtherRaw.bonus_name || '',
            amount: parseFloat(bonusOtherRaw.amount) || 0,
            frequency: bonusOtherRaw.frequency || 'monthly'
          },
          loanOther: {
            name: loanOtherRaw.loan_name || '',
            amount: parseFloat(loanOtherRaw.amount) || 0,
            startMonth: loanOtherRaw.start_month || '',
            startYear: loanOtherRaw.start_year || '',
            durationMonths: loanOtherRaw.duration_months || 0,
            startDate: loanOtherRaw.start_year && loanOtherRaw.start_month ? 
                      `${loanOtherRaw.start_year}-${loanOtherRaw.start_month.padStart(2, '0')}` : ''
          }
        });

        console.log('Final parsed loans and loanOther:', {
          loans: filteredLoans,
          loanOther: {
            name: loanOtherRaw.loan_name || '',
            amount: parseFloat(loanOtherRaw.amount) || 0,
          }
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
  const numericFields = ['baseSalaryPerHour', 'salaryGrade', 'gsisDeduction', 'philhealthDeduction', 'taxDeduction', 'leaveCredits'];

 if (name === 'salaryGrade') {
  const grade = parseInt(value);
  const monthly = salaryGrades[grade] || 0;

  setUserData(prev => ({
    ...prev,
    salaryGrade: value,
    baseMonthlySalary: monthly,
    baseSalaryPerHour: 0
  }));
} else if (name === 'employmentType') {
  const isRegular = value === 'regular';
  setUserData(prev => ({
    ...prev,
    employmentType: value,
    salaryGrade: isRegular ? '12' : '',
    baseSalaryPerHour: isRegular ? 0 : prev.baseSalaryPerHour
  }));
} else {
  setUserData(prev => ({
    ...prev,
    [name]: numericFields.includes(name) ? (parseFloat(value) || 0) : value
  }));
}
};

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const validLoans = userData.loans.filter(
        loan => loan.name && loan.amount > 0 && loan.startMonth && loan.startYear
      );

      const validBonuses = userData.bonuses.filter(
        bonus => bonus.name && bonus.amount > 0 && bonus.type
      );

      const payload = {
        username: userData.username,
        email: userData.email,
        full_name: userData.fullName,
        payrollProfile: {
          employment_type: userData.employmentType,
          salaryGrade: userData.salaryGrade,  
          baseMonthlySalary: userData.baseMonthlySalary,
          baseSalaryPerHour: userData.baseSalaryPerHour,
          gsisDeduction: userData.gsisDeduction,
          philhealthDeduction: userData.philhealthDeduction,
          taxDeduction: userData.taxDeduction,
          leaveCredits: userData.leaveCredits,
          bonuses: validBonuses,
          loans: validLoans,
          bonusOther: userData.bonusOther?.name ? userData.bonusOther : null,
          loanOther: userData.loanOther?.name ? {
            name: userData.loanOther.name,
            amount: userData.loanOther.amount,
            durationMonths: userData.loanOther.durationMonths,
            startMonth: userData.loanOther.startDate?.split('-')[1],
            startYear: userData.loanOther.startDate?.split('-')[0]
          } : null
        }
      };

      if (userData.password) {
        payload.password = userData.password;
      }

      await axios.put('https://backend2-2szh.onrender.com/api/user/profile', payload);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500 border-solid"></div>
    </div>
    </div>
  );
}

return (
  <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden my-10 mx-auto max-w-6xl">
    {/* Header */}
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-10 text-center relative">
      <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_25%_25%,_white_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
      <div className="relative z-10">
        <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl font-bold">
          {userData.fullName.charAt(0) || 'U'}
        </div>
        <h1 className="text-4xl font-bold mb-2">User Profile</h1>
        <p className="text-lg opacity-90">Manage your account and payroll information</p>
      </div>
    </div>

    {/* Alerts */}
    {successMessage && (
      <div className="mx-8 mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-xl">
        {successMessage}
      </div>
    )}
    {errorMessage && (
      <div className="mx-8 mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
        {errorMessage}
      </div>
    )}

    {/* Main Content */}
     <div className="p-10 space-y-16">

      {/* Personal Info */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Full Name</label>
            {editMode ? (
              <input
                name="fullName"
                value={userData.fullName}
                onChange={handleInputChange}
                className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-indigo-500 text-lg"
              />
            ) : (
              <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-lg text-gray-600">
                {userData.fullName || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Username</label>
            <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-100 text-lg text-gray-600">
              {userData.username}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Email</label>
            {editMode ? (
              <input
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-indigo-500 text-lg"
              />
            ) : (
              <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-lg text-gray-600">
                {userData.email || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Password</label>
            {editMode ? (
              <input
                name="password"
                type="password"
                value={userData.password}
                onChange={handleInputChange}
                placeholder="Enter new password"
                className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-indigo-500 text-lg"
              />
            ) : (
              <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-lg text-gray-600">
                ••••••••
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employment Info */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Employment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Employment Type</label>
            {editMode ? (
              <select
                name="employmentType"
                value={userData.employmentType}
                onChange={handleInputChange}
                className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-indigo-500 text-lg"
              >
                <option value="regular">Regular</option>
                <option value="irregular">Irregular</option>
              </select>
            ) : (
              <div className="p-4">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold text-white ${userData.employmentType === 'regular' ? 'bg-green-500' : 'bg-blue-500'}`}>
                  {userData.employmentType}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              {userData.employmentType === 'regular' ? 'Salary Grade' : 'Base Salary/Hour'}
            </label>
            {editMode ? (
              userData.employmentType === 'regular' ? (
                <select
                  name="salaryGrade"
                  value={userData.salaryGrade}
                  onChange={handleInputChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-indigo-500 text-lg"
                >
                  {Object.keys(salaryGrades).map(grade => (
                    <option key={grade} value={grade}>
                      Grade {grade} – ₱{salaryGrades[grade].toFixed(2)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₱</span>
                  <input
                    name="baseSalaryPerHour"
                    type="number"
                    step="0.01"
                    value={userData.baseSalaryPerHour}
                    onChange={handleInputChange}
                    className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-indigo-500 text-lg"
                  />
                </div>
              )
            ) : (
              <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-lg text-gray-600">
                {userData.employmentType === 'regular'
                  ? `Grade ${userData.salaryGrade} (₱${userData.baseMonthlySalary.toFixed(2)})`
                  : `₱${userData.baseSalaryPerHour.toFixed(2)}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Deductions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-100 p-6 rounded-2xl text-center border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">₱{userData.gsisDeduction.toFixed(2)}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">GSIS</div>
          </div>
          <div className="bg-gray-100 p-6 rounded-2xl text-center border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">₱{userData.philhealthDeduction.toFixed(2)}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">PhilHealth</div>
          </div>
          <div className="bg-gray-100 p-6 rounded-2xl text-center border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">₱{userData.taxDeduction.toFixed(2)}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Tax</div>
          </div>
          <div className="bg-gray-100 p-6 rounded-2xl text-center border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">{userData.leaveCredits.toFixed(1)}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Leave Credits</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['gsisDeduction', 'philhealthDeduction', 'taxDeduction'].map(field => (
            <div key={field}>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                {field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              </label>
              {editMode ? (
                <div className="relative">
                  <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₱</span>
                  <input
                    name={field}
                    type="number"
                    value={userData[field]}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full p-4 pl-12 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-indigo-500 text-lg"
                  />
                </div>
              ) : (
                <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-lg text-gray-600">
                  ₱{userData[field].toFixed(2)}
                </div>
              )}
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Leave Credits</label>
            {editMode ? (
              <input
                name="leaveCredits"
                type="number"
                value={userData.leaveCredits}
                onChange={handleInputChange}
                step="0.01"
                className="w-full p-4 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-indigo-500 text-lg"
              />
            ) : (
              <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-lg text-gray-600">
                {userData.leaveCredits.toFixed(2)} day(s)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Replace Bonuses Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Bonuses</h2>
        <div className="bg-gray-50 p-6 rounded-xl border">
          {editMode ? (
            <div className="space-y-4">
              {['13th Month Pay', 'Christmas Bonus', 'Mid-Year Bonus'].map((bonusType) => {
                const existingBonus = userData.bonuses.find(b => b.type === bonusType);
                const isChecked = !!existingBonus;

                const handleBonusCheckbox = () => {
                  if (isChecked) {
                    setUserData(prev => ({
                      ...prev,
                      bonuses: prev.bonuses.filter(b => b.type !== bonusType)
                    }));
                  } else {
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
                  <div key={bonusType} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <label className="flex items-center space-x-3 mb-3">
                      <input type="checkbox" checked={isChecked} onChange={handleBonusCheckbox} className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium">{bonusType}</span>
                    </label>
                    {isChecked && (
                      <div className="ml-7 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={existingBonus.name}
                          onChange={e => handleBonusChange('name', e.target.value)}
                          placeholder="Bonus Name"
                          className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          value={existingBonus.amount}
                          onChange={e => handleBonusChange('amount', e.target.value)}
                          placeholder="Amount"
                          className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                        />
                        <select
                          value={existingBonus.frequency}
                          onChange={e => handleBonusChange('frequency', e.target.value)}
                          className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
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
              <div className="border-b border-gray-200 pb-4">
                <label className="flex items-center space-x-3 mb-3">
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
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="font-medium">Others</span>
                </label>
                {userData.bonusOther.name !== undefined && (
                  <div className="ml-7 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Bonus Name"
                      value={userData.bonusOther.name}
                      onChange={e => setUserData(prev => ({ ...prev, bonusOther: { ...prev.bonusOther, name: e.target.value } }))}
                      className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={userData.bonusOther.amount}
                      onChange={e => setUserData(prev => ({ ...prev, bonusOther: { ...prev.bonusOther, amount: parseFloat(e.target.value) || 0 } }))}
                      className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                    <select
                      value={userData.bonusOther.frequency}
                      onChange={e => setUserData(prev => ({ ...prev, bonusOther: { ...prev.bonusOther, frequency: e.target.value } }))}
                      className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {userData.bonuses.map(b => (
                <div key={b.type} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                  <div>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-sm text-gray-500">{b.frequency}</div>
                  </div>
                  <div className="text-lg font-semibold">₱{b.amount.toFixed(2)}</div>
                </div>
              ))}
              {userData.bonusOther?.name && (
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                  <div>
                    <div className="font-medium">Other: {userData.bonusOther.name}</div>
                    <div className="text-sm text-gray-500">{userData.bonusOther.frequency}</div>
                  </div>
                  <div className="text-lg font-semibold">₱{userData.bonusOther.amount.toFixed(2)}</div>
                </div>
              )}
              {userData.bonuses.length === 0 && !userData.bonusOther?.name && (
                <div className="text-center text-gray-500 py-4">No bonuses configured</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Replace Loans Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Loans</h2>
        <div className="bg-gray-50 p-6 rounded-xl border">
          {editMode ? (
            <div className="space-y-4">
              {['Calamity Loan', 'Emergency Loan', 'GSIS Loan'].map((loanType) => {
                const existingLoan = userData.loans.find(l => l.type === loanType);
                const isChecked = !!existingLoan;

                const startDate = existingLoan && existingLoan.startMonth && existingLoan.startYear
                  ? `${existingLoan.startYear}-${existingLoan.startMonth.padStart(2, '0')}` : '';

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
                  <div key={loanType} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <label className="flex items-center space-x-3 mb-3">
                      <input type="checkbox" checked={isChecked} onChange={handleLoanCheckbox} className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium">{loanType}</span>
                    </label>
                    {isChecked && (
                      <div className="ml-7 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          value={existingLoan.name}
                          onChange={e => handleLoanChange('name', e.target.value)}
                          placeholder="Loan Name"
                          className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          value={existingLoan.amount}
                          onChange={e => handleLoanChange('amount', e.target.value)}
                          placeholder="Amount"
                          className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          type="month"
                          value={startDate}
                          onChange={e => handleLoanChange('startDate', e.target.value)}
                          className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Duration (months)"
                          value={existingLoan.durationMonths || ''}
                          onChange={e => handleLoanChange('durationMonths', e.target.value)}
                          className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loan Other */}
              <div className="border-b border-gray-200 pb-4">
                <label className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    checked={!!userData.loanOther.name}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setUserData(prev => ({
                          ...prev,
                          loanOther: { name: '', amount: 0, startDate: '', durationMonths: 0 }
                        }));
                      } else {
                        setUserData(prev => ({ ...prev, loanOther: {} }));
                      }
                    }}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="font-medium">Others</span>
                </label>
                {userData.loanOther.name !== undefined && (
                  <div className="ml-7 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Loan Name"
                      value={userData.loanOther.name}
                      onChange={e =>
                        setUserData(prev => ({ ...prev, loanOther: { ...prev.loanOther, name: e.target.value } }))
                      }
                      className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={userData.loanOther.amount}
                      onChange={e =>
                        setUserData(prev => ({ ...prev, loanOther: { ...prev.loanOther, amount: parseFloat(e.target.value) || 0 } }))
                      }
                      className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="month"
                      value={userData.loanOther.startDate || ''}
                      onChange={e =>
                        setUserData(prev => ({ ...prev, loanOther: { ...prev.loanOther, startDate: e.target.value } }))
                      }
                      className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Duration (months)"
                      value={userData.loanOther.durationMonths || ''}
                      onChange={e =>
                        setUserData(prev => ({ ...prev, loanOther: { ...prev.loanOther, durationMonths: parseInt(e.target.value) || 0 } }))
                      }
                      className="p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
        {userData.loans.map(l => (
          <div key={l.type} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
            <div>
              <div className="font-medium">{l.name}</div>
              <div className="text-sm text-gray-500">
                Start: {String(l.startMonth).padStart(2, '0')}/{String(l.startYear).slice(-2)} • {l.durationMonths} months
              </div>
            </div>
            <div className="text-lg font-semibold">₱{l.amount.toFixed(2)}</div>
          </div>
        ))}
        {userData.loanOther?.name && (
          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
            <div>
              <div className="font-medium">{userData.loanOther.name}</div>
              <div className="text-sm text-gray-500">
                Start: {userData.loanOther.startDate} • {userData.loanOther.durationMonths} months
              </div>
            </div>
            <div className="text-lg font-semibold">₱{userData.loanOther.amount.toFixed(2)}</div>
          </div>
        )}
        {userData.loans.length === 0 && !userData.loanOther?.name && (
          <div className="text-center text-gray-500 py-4">No loans configured</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex justify-end gap-4 px-10 pb-10">
      {editMode ? (
        <>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold transition"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={() => setEditMode(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          Edit Profile
        </button>
      )}
    </div>
  </div>
);
};

export default ProfilePage;

import React, { useState } from 'react';

const RecordsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [activeTab, setActiveTab] = useState('Records');
  
  const [records] = useState([
    { month: 'March 2025', name: 'Von Pelipe', earnings: 4850, deductions: 790 },
    { month: 'April 2025', name: 'Von Pelipe', earnings: 5200, deductions: 850 },
  ]);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = selectedMonth ? record.month.includes(selectedMonth) : true;
    return matchesSearch && matchesMonth;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount).replace('₱', '₱ ');
  };

  return (
    <div className="records-container">
      <div className="records-header">
        <h1 className="records-title">Payroll Records</h1>
      </div>

      <div className="search-filter">
        <input
          type="text"
          className="search-input"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input 
          type="month" 
          className="search-input"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
      </div>

      <table className="records-table">
  <thead>
    <tr>
      <th>Month</th>
      <th>Name</th> {/* This duplicate will be hidden by CSS */}
      <th>Earnings</th>
      <th>Deductions</th>
      <th>Net Pay</th>
    </tr>
  </thead>
  <tbody>
    {filteredRecords.map((record, index) => (
      <tr key={index}>
        <td>{record.month}</td>
        <td>{record.name}</td>
        <td className="currency">{formatCurrency(record.earnings)}</td>
        <td className="currency">{formatCurrency(record.deductions)}</td>
        <td className="currency">{formatCurrency(record.earnings - record.deductions)}</td>
      </tr>
    ))}
  </tbody>
</table>
    </div>
  );
};

export default RecordsPage;
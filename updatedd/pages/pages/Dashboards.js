import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const employee = {
    id: '1004',
    name: 'Jose Manalo',
    position: 'Teacher',
    period: 'April 2025',
    earnings: [
      { label: 'Basic Pay', amount: 2250 },
      { label: 'Conveyance Allowance', amount: 750 },
      { label: 'House Rent Allowance', amount: 1125 },
    ],
    deductions: [
      { label: 'Income Tax', amount: 450 },
      { label: 'Loan Repayment', amount: 160 },
    ],
  };

  const totalEarnings = employee.earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = employee.deductions.reduce((sum, d) => sum + d.amount, 0);
  const netPay = totalEarnings - totalDeductions;

  return (
    <div className="payslip-container">
      <div className="payslip-header">
        <h1 className="payslip-title">Payslip</h1>
        <p className="employee-info">
          {employee.name} | Position: {employee.position} | Period: {employee.period}
        </p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Total Earnings</div>
          <div className="summary-value">₱{totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Deductions</div>
          <div className="summary-value">₱{totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Net Pay</div>
          <div className="summary-value">₱{netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Earnings Table */}
      <table className="details-table">
        <thead>
          <tr>
            <th>Earnings Breakdown</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {employee.earnings.map((e, i) => (
            <tr key={i}>
              <td>{e.label}</td>
              <td>₱{e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td>Total Earnings</td>
            <td>₱{totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      {/* Deductions Table */}
      <table className="details-table">
        <thead>
          <tr>
            <th>Deductions Breakdown</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {employee.deductions.map((d, i) => (
            <tr key={i}>
              <td>{d.label}</td>
              <td>₱{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td>Total Deductions</td>
            <td>₱{totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      <div className="action-buttons">
        <Link to="/upload" className="btn btn-primary">Upload New Payslip</Link>
        <Link to="/reports" className="btn btn-primary">Generate Report</Link>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [payslip, setPayslip] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const username = localStorage.getItem('username');

  // Fetch user info (e.g., full name, position)
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/payslip/latest`, {
          params: { username }
        });
        setUserInfo(res.data);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };

    fetchUserInfo();
  }, [username]);

  // Fetch latest payslip
  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/payslip/latest`, {
          params: { username }
        });
        setPayslip(res.data);
      } catch (error) {
        console.error("Failed to fetch payslip:", error);
      }
    };

    fetchPayslip();
  }, [username]);

  if (!userInfo || !payslip) {
    return <div>Loading dashboard...</div>;
  }

  const totalEarnings = payslip.grossIncome;
  const totalDeductions = payslip.deductions.reduce((sum, d) => sum + d.amount, 0);
  const netPay = payslip.netPay;

  return (
    <div className="payslip-container">
      <div className="payslip-header">
        <h1 className="payslip-title">{payslip.fullName}</h1>
        <p className="employee-info">
          Period: {payslip.period}
        </p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Gross Income</div>
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

      {/* Bonuses Table */}
      <table className="details-table">
        <thead>
          <tr>
            <th>Income Breakdown</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {payslip.bonuses.map((e, i) => (
            <tr key={i}>
              <td>{e.label}</td>
              <td>₱{e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
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
          {payslip.deductions.map((d, i) => (
            <tr key={i}>
              <td>{d.label}</td>
              <td>₱{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
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

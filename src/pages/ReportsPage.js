import React from 'react';

const PayslipPage = () => {
  // Sample static data
  const employee = {
    name: 'Juan Dela Cruz',
    period: 'April 1–15, 2025',
    totalHours: 80,
    ratePerHour: 150,
    grossIncome: 12000,
    deductions: [
      { label: 'SSS', amount: 500 },
      { label: 'Pag-IBIG', amount: 200 },
      { label: 'PhilHealth', amount: 300 },
      { label: 'Withholding Tax', amount: 600 },
    ],
  };

  const totalDeductions = employee.deductions.reduce((sum, d) => sum + d.amount, 0);
  const netPay = employee.grossIncome - totalDeductions;

  return (
    <div className="payslip-container">
      <div className="payslip-header">
        <h1 className="payslip-title">Payslip</h1>
        <p className="employee-info">{employee.name} | Period: {employee.period}</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Total Hours</div>
          <div className="summary-value">{employee.totalHours} hrs</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Rate / Hour</div>
          <div className="summary-value">₱{employee.ratePerHour}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Gross Income</div>
          <div className="summary-value">₱{employee.grossIncome.toLocaleString()}</div>
        </div>
      </div>

      <table className="details-table">
        <thead>
          <tr>
            <th>Deductions</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {employee.deductions.map((deduction, index) => (
            <tr key={index}>
              <td>{deduction.label}</td>
              <td>₱{deduction.amount.toLocaleString()}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td>Total Deductions</td>
            <td>₱{totalDeductions.toLocaleString()}</td>
          </tr>
          <tr className="total-row">
            <td><strong>Net Pay</strong></td>
            <td><strong>₱{netPay.toLocaleString()}</strong></td>
          </tr>
        </tbody>
      </table>

      <div className="action-buttons">
        <button className="btn btn-primary">Print Payslip</button>
      </div>
    </div>
  );
};

export default PayslipPage;

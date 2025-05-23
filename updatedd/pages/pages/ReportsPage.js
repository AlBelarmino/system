import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PayslipPage = () => {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonthYear, setSelectedMonthYear] = useState({ month: '', year: '' });
  const [availableMonths, setAvailableMonths] = useState([]);
  const [error, setError] = useState(null);

  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const response = await axios.get('http://localhost:8000/available-months', {
          params: { username }
        });
        setAvailableMonths(response.data);
      } catch (err) {
        console.error("Failed to fetch available months", err);
      }
    };
    fetchAvailableMonths();
  }, [username]);

  useEffect(() => {
    const fetchPayslip = async () => {
      if (!selectedMonthYear.month || !selectedMonthYear.year) return;
      setLoading(true);
      setError(null);
      setPayslip(null);

      try {
        const response = await axios.get('http://localhost:8000/payslip', {
          params: {
            username,
            month: selectedMonthYear.month,
            year: selectedMonthYear.year
          }
        });
        setPayslip(response.data);
      } catch (err) {
        console.error("Failed to fetch payslip", err);
        if (err.response?.status === 404) {
          const detail = err.response?.data?.detail;
          if (detail?.available_months) {
            setAvailableMonths(detail.available_months);
          }
          setError(detail?.error || "No payslip found for selected period");
        } else {
          setError("Unable to load payslip. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPayslip();
  }, [selectedMonthYear, username]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="payslip-container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <label className="font-semibold">Select Month:</label>
        <select
          value={`${selectedMonthYear.month}-${selectedMonthYear.year}`}
          onChange={(e) => {
            const [month, year] = e.target.value.split('-');
            setSelectedMonthYear({ month, year: parseInt(year) });
          }}
          className="border px-3 py-2 ml-3"
          disabled={loading}
        >
          <option value="">-- Select Month --</option>
          {availableMonths.map(({ month, year }) => (
            <option key={`${month}-${year}`} value={`${month}-${year}`}>
              {`${month} ${year}`}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="text-center py-4">Loading payslip...</div>}
      {error && <div className="text-red-600 py-4">{error}</div>}

      {payslip && (
        <div className="payslip-content bg-white p-6 rounded shadow">
          {/* Header */}
          <div className="payslip-header mb-6 border-b pb-4">
            <h1 className="payslip-title">Employee Payslip</h1>
            <div className="grid grid-cols-2 mt-2">
              <div>
                <p className="font-semibold">{payslip.fullName}</p>
                <p>{payslip.position}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Period:</p>
                <p>{`${selectedMonthYear.month} ${selectedMonthYear.year}`}</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-grid mb-6">
            <div className="summary-card">
              <div className="summary-label">Working Days</div>
              <div className="summary-value">{payslip.workingDays}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Days Present</div>
              <div className="summary-value">{payslip.daysPresent}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Days Absent</div>
              <div className="summary-value">{payslip.daysAbsent}</div>
            </div>
          </div>

          <div className="summary-grid mb-6">
            <div className="summary-card">
              <div className="summary-label">Total Hours</div>
              <div className="summary-value">{payslip.totalHours} hrs</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Rate / Hour</div>
              <div className="summary-value">₱{payslip.ratePerHour}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Gross Income</div>
              <div className="summary-value">₱{payslip.grossIncome.toLocaleString()}</div>
            </div>
          </div>

          {/* Deductions Table */}
          <table className="details-table mb-6">
            <thead>
              <tr>
                <th>Deductions</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payslip.deductions.map((d, i) => (
                <tr key={i}>
                  <td>{d.label}</td>
                  <td>₱{d.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="total-row font-semibold">
                <td>Total Deductions</td>
                <td>₱{payslip.deductions.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</td>
              </tr>
              <tr className="font-bold">
                <td>Net Pay</td>
                <td>₱{payslip.netPay.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="action-buttons">
            <button
              onClick={handlePrint}
              className="btn btn-primary"
            >
              Print Payslip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayslipPage;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, FileText, Download, Clock, DollarSign, TrendingUp, Building, Calculator, Eye, ChevronDown, ChevronUp } from 'lucide-react';

const ReportsPage = () => {
  const [payslip, setPayslip] = useState(null);
  const [summaryReport, setSummaryReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [error, setError] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(true);

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
    const fetchData = async () => {
      if (selectedMonths.length === 0) return;

      setLoading(true);
      setError(null);
      setPayslip(null);
      setSummaryReport(null);

      try {
        if (selectedMonths.length === 1) {
          const [month, year] = selectedMonths[0].split('-');
          const response = await axios.get('http://localhost:8000/payslip', {
            params: {
              username,
              month,
              year: parseInt(year)
            }
          });
          setPayslip(response.data);
        } else {
          const response = await axios.post('http://localhost:8000/api/payslip/summary', {
            username,
            selected_months: selectedMonths.map(m => {
              const [month, year] = m.split('-');
              return { month, year: parseInt(year) };
            })
          });
          setSummaryReport(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
        if (err.response?.status === 404) {
          const detail = err.response?.data?.detail;
          if (detail?.available_months) {
            setAvailableMonths(detail.available_months);
          }
          setError(detail?.error || "No data found for selected period");
        } else {
          setError("Unable to load data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonths, username]);

  const handlePrint = () => {
    window.print();
  };

  const handleMonthSelection = (e, monthEntry) => {
    const monthKey = `${monthEntry.month}-${monthEntry.year}`;
    if (e.target.checked) {
      if (selectedMonths.length < 12) {
        setSelectedMonths([...selectedMonths, monthKey]);
      }
    } else {
      setSelectedMonths(selectedMonths.filter(m => m !== monthKey));
    }
  };

  const isMonthSelected = (monthEntry) => {
    return selectedMonths.includes(`${monthEntry.month}-${monthEntry.year}`);
  };

  const formatCurrency = (amount) => {
    return `₱${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const StatCard = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Payroll Reports
          </h1>
          <p className="text-gray-600">Generate and view your payroll summaries and detailed reports</p>
        </div>

        {/* Month Selection Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
          <div 
            className="p-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowMonthPicker(!showMonthPicker)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Select Report Period</h3>
                  <p className="text-sm text-gray-600">Choose up to 12 months to include in your report</p>
                </div>
              </div>
              {showMonthPicker ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
          
          {showMonthPicker && (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {availableMonths.map((monthEntry) => (
                  <label
                    key={`${monthEntry.month}-${monthEntry.year}`}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                      isMonthSelected(monthEntry)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    } ${
                      selectedMonths.length >= 12 && !isMonthSelected(monthEntry)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isMonthSelected(monthEntry)}
                      onChange={(e) => handleMonthSelection(e, monthEntry)}
                      disabled={selectedMonths.length >= 12 && !isMonthSelected(monthEntry)}
                    />
                    <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                      isMonthSelected(monthEntry) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {isMonthSelected(monthEntry) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{`${monthEntry.month} ${monthEntry.year}`}</span>
                  </label>
                ))}
              </div>
              
              {selectedMonths.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-700">Selected Periods:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMonths.map(month => (
                      <span key={month} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {month.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your payroll data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">!</span>
              </div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Single Month Payslip View */}
        {payslip && selectedMonths.length === 1 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-1">{payslip.fullName}</h1>
                  <p className="text-blue-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {payslip.period} | {payslip.employmentType.charAt(0).toUpperCase() + payslip.employmentType.slice(1)} Employee
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm">Net Pay</p>
                  <p className="text-3xl font-bold">{formatCurrency(payslip.netPay)}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={Calendar}
                  label="Working Days"
                  value={payslip.workingDays}
                />
                <StatCard
                  icon={Clock}
                  label="Days Present"
                  value={payslip.daysPresent}
                  className="border-l-4 border-l-green-500"
                />
                {payslip.daysAbsent !== undefined && (
                  <StatCard
                    icon={Clock}
                    label="Days Absent"
                    value={payslip.daysAbsent}
                    className="border-l-4 border-l-red-500"
                  />
                )}
                {payslip.employmentType === "irregular" && (
                  <>
                    <StatCard
                      icon={Clock}
                      label="Total Hours"
                      value={`${payslip.totalHours} hrs`}
                    />
                    <StatCard
                      icon={DollarSign}
                      label="Rate / Hour"
                      value={formatCurrency(payslip.ratePerHour)}
                    />
                  </>
                )}
                {payslip.employmentType === "regular" && (
                  <StatCard
                    icon={DollarSign}
                    label="Monthly Rate"
                    value={formatCurrency(payslip.ratePerMonth)}
                  />
                )}
                <StatCard
                  icon={TrendingUp}
                  label="Gross Income"
                  value={formatCurrency(payslip.grossIncome)}
                />
              </div>

              {/* Bonuses Table */}
              {payslip.bonuses?.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Bonuses & Additional Income
                  </h2>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left p-4 font-semibold text-gray-700">Bonus Type</th>
                          <th className="text-right p-4 font-semibold text-gray-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {payslip.bonuses.map((b, i) => (
                          <tr key={i} className="hover:bg-white transition-colors">
                            <td className="p-4 text-gray-900">{b.label}</td>
                            <td className="p-4 text-right font-semibold text-green-600">{formatCurrency(b.amount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-green-50 font-semibold">
                          <td className="p-4 text-gray-900">Total Bonuses</td>
                          <td className="p-4 text-right text-green-700">
                            {formatCurrency(payslip.bonuses.reduce((sum, b) => sum + b.amount, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Deductions Table */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-red-600" />
                  Deductions
                </h2>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">Deduction Type</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Amount</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payslip.deductions?.length > 0 ? (
                        payslip.deductions.map((d, i) => (
                          <tr key={i} className="hover:bg-white transition-colors">
                            <td className="p-4 text-gray-900">{d.label}</td>
                            <td className="p-4 text-right font-semibold text-red-600">{formatCurrency(d.amount)}</td>
                            <td className="p-4 text-right font-medium text-gray-600">
                            {d.balance !== undefined ? formatCurrency(d.balance) : 'N/A'}
                          </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-4 text-center text-gray-500 italic">No deductions this period</td>
                        </tr>
                      )}
                      <tr className="bg-red-50 font-semibold">
                        <td className="p-4 text-gray-900">Total Deductions</td>
                        <td className="p-4 text-right text-red-700">
                          {formatCurrency(payslip.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0)}
                        </td>
                      </tr>
                      <tr className="bg-blue-50 font-bold text-lg">
                        <td className="p-4 text-gray-900">NET PAY</td>
                        <td className="p-4 text-right text-blue-700">{formatCurrency(payslip.netPay)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <button
                  onClick={handlePrint}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Download className="w-5 h-5" />
                  Print Payslip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Report View */}
        {summaryReport && selectedMonths.length > 1 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-1">{summaryReport.fullName}</h1>
                  <p className="text-indigo-100 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {summaryReport.employmentType.charAt(0).toUpperCase() + summaryReport.employmentType.slice(1)} Employee | Grade {summaryReport.salaryGrade}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-indigo-100 text-sm">Total Net Pay</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(
                      Object.values(summaryReport.monthlySummary).reduce((sum, data) => sum + data.net_income, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Monthly Summary */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Monthly Summary
                </h2>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700">Period</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Income</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Deductions</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(summaryReport.monthlySummary).map(([period, data]) => (
                        <tr key={period} className="hover:bg-white transition-colors">
                          <td className="p-4 font-medium text-gray-900">{period.replace('-', ' ')}</td>
                          <td className="p-4 text-right font-semibold text-green-600">{formatCurrency(data.gross_income)}</td>
                          <td className="p-4 text-right font-semibold text-red-600">{formatCurrency(data.total_deductions)}</td>
                          <td className="p-4 text-right font-semibold text-blue-600">{formatCurrency(data.net_income)}</td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50 font-bold text-lg">
                        <td className="p-4 text-gray-900">TOTAL</td>
                        <td className="p-4 text-right text-green-700">
                          {formatCurrency(
                            Object.values(summaryReport.monthlySummary).reduce((sum, data) => sum + data.gross_income, 0)
                          )}
                        </td>
                        <td className="p-4 text-right text-red-700">
                          {formatCurrency(
                            Object.values(summaryReport.monthlySummary).reduce((sum, data) => sum + data.total_deductions, 0)
                          )}
                        </td>
                        <td className="p-4 text-right text-blue-700">
                          {formatCurrency(
                            Object.values(summaryReport.monthlySummary).reduce((sum, data) => sum + data.net_income, 0)
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Income Breakdown */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Income Breakdown
                </h2>
                <div className="bg-gray-50 rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-700 sticky left-0 bg-gray-100">Income Type</th>
                        {Object.keys(summaryReport.monthlySummary).map(period => (
                          <th key={`income-${period}`} className="text-right p-4 font-semibold text-gray-700 min-w-[120px]">
                            {period.split('-')[0]} {period.split('-')[1]}
                          </th>
                        ))}
                        <th className="text-right p-4 font-semibold text-gray-700 min-w-[120px]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(summaryReport.incomeBreakdown).map(([incomeType, amounts]) => (
                        <tr key={incomeType} className="hover:bg-white transition-colors">
                          <td className="p-4 font-medium text-gray-900 sticky left-0 bg-gray-50">{incomeType}</td>
                          {Object.keys(summaryReport.monthlySummary).map(period => (
                            <td key={`${incomeType}-${period}`} className="p-4 text-right">
                              {amounts[period] ? (
                                <span className="font-semibold text-green-600">{formatCurrency(amounts[period])}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))}
                          <td className="p-4 text-right font-bold text-green-700">
                            {formatCurrency(Object.values(amounts).reduce((sum, amount) => sum + amount, 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Deduction Breakdown */}
              <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-red-600" />
                Deduction Breakdown
              </h2>
              <div className="bg-gray-50 rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-700 sticky left-0 bg-gray-100">Deduction Type</th>
                      {Object.keys(summaryReport.monthlySummary).map(period => (
                        <th key={`deduction-${period}`} className="text-right p-4 font-semibold text-gray-700 min-w-[120px]">
                          {period.replace('-', ' ')}
                        </th>
                      ))}
                      <th className="text-right p-4 font-semibold text-gray-700">Total</th>
                      <th className="text-right p-4 font-semibold text-gray-700">Current Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(summaryReport.deductionBreakdown)
                    .filter(([key]) => !key.endsWith('_balance'))
                    .map(([deductionType, amounts]) => {
                      const balanceKey = `${deductionType}_balance`;
                      const lastMonth = summaryReport.months?.slice(-1)[0] || '';
                      const balance = summaryReport.deductionBreakdown[balanceKey]?.[lastMonth] || 0;

                      return (
                        <tr key={deductionType} className="hover:bg-white transition-colors">
                          <td className="p-4 font-medium text-gray-900 sticky left-0 bg-gray-50">{deductionType}</td>
                          {Object.keys(summaryReport.monthlySummary).map(period => (
                            <td key={`${deductionType}-${period}`} className="p-4 text-right">
                              {amounts[period] ? (
                                <span className="font-semibold text-red-600">
                                  {formatCurrency(amounts[period])}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))}
                          <td className="p-4 text-right font-bold text-red-700">
                            {formatCurrency(
                              Object.values(amounts).reduce((sum, amount) => sum + amount, 0)
                            )}
                          </td>
                          <td className="p-4 text-right font-medium text-gray-600">
                            {formatCurrency(balance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <button
                  onClick={handlePrint}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Download className="w-5 h-5" />
                  Print Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

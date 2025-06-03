import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Calendar, TrendingDown, TrendingUp } from 'lucide-react';

const RecordsPage = () => {
  const username = localStorage.getItem('username');
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format currency as PHP
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount || 0);

  // Parse YYYY-MM to display month/year
  const parseMonthYear = (period) => {
    const [year, month] = period.split('-');
    const date = new Date(year, month - 1);
    return {
      monthName: date.toLocaleString('default', { month: 'long' }),
      year: year,
    };
  };

  // Fetch records
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `https://backend2-2szh.onrender.com/api/records?username=${username}`
        );

        const formatted = response.data.map((item) => ({
          period: item.period,
          displayMonth: item.displayMonth || `${parseMonthYear(item.period).monthName} ${parseMonthYear(item.period).year}`,
          gross_income: item.gross_income,
          total_deductions: item.total_deductions,
          net_income: item.net_income,
          created_at: new Date(item.created_at).toLocaleDateString(),
        }));

        setRecords(formatted);
      } catch (err) {
        console.error('Error fetching records:', err);
        setError('Failed to load records. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      console.log('📌 Username from localStorage:', username);
      fetchRecords();
    } else {
      console.warn('⚠️ No username found in localStorage!');
    }
  }, [username]);

  // Filter search
  const filteredRecords = records.filter((record) => {
    const search = searchTerm.toLowerCase();
    if (!search) return true;

    const [searchType, ...monthParts] = search.split(' in ');
    const monthQuery = monthParts.join(' ').trim();

    if (searchType.includes('deduct')) {
      if (!monthQuery) return true;
      return record.displayMonth.toLowerCase().includes(monthQuery);
    }

    if (searchType.includes('income') || searchType.includes('earning')) {
      if (!monthQuery) return true;
      return record.displayMonth.toLowerCase().includes(monthQuery);
    }

    return (
      record.displayMonth.toLowerCase().includes(search) ||
      record.period.toLowerCase().includes(search)
    );
  });

  // Summary
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    if (term.includes('deduct')) {
      const total = filteredRecords.reduce((acc, curr) => acc + curr.total_deductions, 0);
      setSummary(`Total Deductions: ${formatCurrency(total)}`);
    } else if (term.includes('income') || term.includes('earning')) {
      const total = filteredRecords.reduce((acc, curr) => acc + curr.gross_income, 0);
      setSummary(`Total Income: ${formatCurrency(total)}`);
    } else {
      setSummary('');
    }
  }, [searchTerm, filteredRecords]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payroll records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-center">
            <TrendingDown size={48} className="mx-auto mb-4" />
            <p className="text-lg font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-semibold text-gray-600">No payroll records found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Payroll History</h1>
                <p className="text-gray-600">View and search your payroll records</p>
              </div>
            </div>
            
            {/* Search Box */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search (e.g., 'deductions in March' or '2023-04')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {searchTerm.toLowerCase().includes('deduct') ? (
                  <TrendingDown className="w-6 h-6" />
                ) : (
                  <TrendingUp className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">Search Summary</h3>
                <p className="text-blue-100">{summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Income
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Deductions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.displayMonth}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.period}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(record.gross_income)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrendingDown className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(record.total_deductions)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        
                        <span className="text-sm font-medium text-blue-600">
                          {formatCurrency(record.net_income)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.created_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredRecords.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No records found for "{searchTerm}"</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search terms</p>
            </div>
          )}
        </div>

        {/* Search Examples */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Search Examples</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">Total Deductions</h4>
              <p className="text-sm text-gray-600 mt-1">Type: "deductions"</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">Monthly Deductions</h4>
              <p className="text-sm text-gray-600 mt-1">Type: "deductions in January"</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">Total Income</h4>
              <p className="text-sm text-gray-600 mt-1">Type: "income"</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">Monthly Income</h4>
              <p className="text-sm text-gray-600 mt-1">Type: "income in July"</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">Month Records</h4>
              <p className="text-sm text-gray-600 mt-1">Type: "August" or "2025-08"</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">Year Records</h4>
              <p className="text-sm text-gray-600 mt-1">Type: "2025"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordsPage;

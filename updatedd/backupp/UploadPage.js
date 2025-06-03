import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, FileText, Check, X, Copy, Calculator, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [parsedDTRs, setParsedDTRs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast system
  const toast = {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    info: (message) => addToast(message, 'info')
  };

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setError(null);
      setSuccess(null);
      setExtractedText('');
      setParsedDTRs([]);

      const validFile = acceptedFiles.find(file => file.type.match('image.*') || file.type === 'application/pdf');
      if (!validFile) {
        return setError('Only images and PDF files are supported.');
      }

      validFile.preview = validFile.type.startsWith('image') ? URL.createObjectURL(validFile) : null;
      setFiles([validFile]);
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const processOCR = async (replaceExisting = false) => {
    if (files.length === 0) {
      toast.error('Please select a file first.');
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      toast.error('You must be logged in to scan a DTR.');
      return;
    }

    const { username } = JSON.parse(storedUser);

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('username', username);
    if (replaceExisting) {
      formData.append('replace_existing', 'true');
    }

    setIsProcessing(true);
    setExtractedText('');
    setParsedDTRs([]);

    try {
      const res = await axios.post('https://backend2-2szh.onrender.com/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('OCR Response:', res.data);

      if (res.data) {
        setExtractedText(res.data.text || '');
        setParsedDTRs(res.data.parsedDTRs || []);
        
        if (res.data.parsedDTRs && res.data.parsedDTRs.length > 0) {
          console.log('Parsed DTRs:', res.data.parsedDTRs);
          console.log('Daily Records:', res.data.parsedDTRs[0].dailyRecords);
        }
        
        toast.success(res.data.message || 'DTR scanned and saved successfully!');
      } else {
        throw new Error('Empty response from server');
      }
    } catch (err) {
      let message = 'OCR processing failed.';
      console.error('OCR Error:', err);

      if (err.response) {
        if (err.response.status === 403) {
          message = `Access denied: ${err.response.data.detail}`;
        } else if (err.response.status === 409) {
          const confirmReplace = window.confirm(
            `${err.response.data.detail}\n\nDo you want to replace the existing DTR?`
          );
          if (confirmReplace) {
            await processOCR(true);
          } else {
            toast.info('DTR upload canceled.');
          }
          return;
        } else if (err.response.data?.detail) {
          message = `Error: ${err.response.data.detail}`;
        } else {
          message = `Server error: ${err.response.statusText}`;
        }
      } else if (err.request) {
        message = 'No response from server. Please check your network connection.';
      } else {
        message = err.message || message;
      }

      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setExtractedText('');
    setParsedDTRs([]);
    setError(null);
    setSuccess(null);
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  };

  const computeAllSalaries = async () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    toast.error('Login required to compute salary.');
    return;
  }
  const { username } = JSON.parse(storedUser);

  try {
    for (const dtr of parsedDTRs) {
      await axios.post('https://backend2-2szh.onrender.com/compute_salary', {
        username,
        month_str: dtr.month
      });
    }

    toast.success('All salaries computed successfully! Redirecting to Reports...');
    setTimeout(() => {
      window.location.href = '/reports';
    }, 2000);
  } catch (err) {
    console.error(err);
    toast.error('Failed to compute all salaries.');
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">DTR Processing</h1>
          <p className="text-slate-600">Upload and extract data from your Daily Time Records</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-red-400 hover:text-red-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-800 font-medium">Success</p>
              <p className="text-green-700">{success}</p>
            </div>
            <button 
              onClick={() => setSuccess(null)} 
              className="text-green-400 hover:text-green-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
          <div className="p-6">
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                ${files.length ? 'border-green-300 bg-green-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'}
                ${isDragActive ? 'border-blue-400 bg-blue-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              <div className="flex flex-col items-center gap-4">
                {files.length ? (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-green-800">File Ready</p>
                      <p className="text-green-600">{files[0].name}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-700">Drop your DTR here</p>
                      <p className="text-slate-500">or click to browse files</p>
                      <p className="text-sm text-slate-400 mt-2">Supports images (PNG, JPG) and PDF files</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* File Preview and Actions */}
            {files.length > 0 && (
              <div className="mt-6 flex flex-col lg:flex-row gap-6">
                {files[0].preview && (
                  <div className="lg:w-1/3">
                    <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden">
                      <img
                        src={files[0].preview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE0IDJINkM0Ljg5IDIgNCAyLjg5IDQgNFYyMEM0IDIxLjExIDQuODkgMjIgNiAyMkgxOEMxOS4xMSAyMiAyMCAyMS4xMSAyMCAyMFY4TDE0IDJaIiBzdHJva2U9IiM5CA0OTQ5NSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHA1dGggZD0iTTE0IDJWOEgyMCIgc3Ryb2tlPSIjOTA5NDk1IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => processOCR(false)}
                      disabled={isProcessing}
                      className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
                        ${isProcessing 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                        }
                      `}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          Extract Text
                        </>
                      )}
                    </button>

                    <button 
                      onClick={clearAll} 
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all duration-200 disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Extracted Text Section */}
        {extractedText && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">Raw Extracted Text</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(extractedText)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {extractedText}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Parsed DTR Data */}
        {parsedDTRs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Extracted DTR Information</h3>
              
              {parsedDTRs.map((dtr, index) => (
                <div key={index} className="space-y-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">DTR {index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(dtr).filter(([key]) => key !== 'dailyRecords').map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-slate-200 last:border-b-0">
                          <span className="font-medium text-slate-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-slate-800">{renderValue(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {dtr.dailyRecords && dtr.dailyRecords.length > 0 && (
                    <div>
                      <h5 className="text-lg font-semibold text-slate-800 mb-4">Daily Records</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full border border-slate-200 rounded-xl overflow-hidden">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">Day</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">AM Arrival</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">AM Departure</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">PM Arrival</th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">PM Departure</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dtr.dailyRecords.map((record, idx) => (
                              <tr key={idx} className="border-t border-slate-200 hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{record.day}</td>
                                <td className="px-4 py-3 text-slate-600">{record.am_arrival || 'N/A'}</td>
                                <td className="px-4 py-3 text-slate-600">{record.am_departure || 'N/A'}</td>
                                <td className="px-4 py-3 text-slate-600">{record.pm_arrival || 'N/A'}</td>
                                <td className="px-4 py-3 text-slate-600">{record.pm_departure || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-10 flex justify-center">
                      <button
                        onClick={computeAllSalaries}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Calculator className="w-5 h-5" />
                        Compute All Salaries
                      </button>
                    </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toast Container */}
        <div className="fixed top-20 right-4 z-[1100] space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-sm
                ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
                ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
                ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
                animate-in slide-in-from-right-full duration-300
              `}
            >
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
              {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;

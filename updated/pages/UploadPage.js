import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import '../App.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [parsedDTRs, setParsedDTRs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [files]);

  const onDrop = (acceptedFiles) => {
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
  };

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
      const res = await axios.post('http://localhost:8000/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('OCR Response:', res.data); // Debug log

      if (res.data) {
        setExtractedText(res.data.text || '');
        setParsedDTRs(res.data.parsedDTRs || []);
        
        // Log the parsed data for debugging
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
            await processOCR(true); // Retry with replacement
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

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

  return (
    <div className="payslip-container">
      <h1>Upload & Process DTR</h1>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <strong>Success:</strong> {success}
          <button onClick={() => setSuccess(null)} className="close-btn">×</button>
        </div>
      )}

      <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'active' : ''} ${files.length ? 'has-file' : ''}`}>
        <input {...getInputProps()} />
        <p>{files.length ? `File ready: ${files[0].name}` : 'Drag & drop a DTR (image or PDF) here, or click to select'}</p>
      </div>

      {files.length > 0 && (
        <div className="file-section">
          {files[0].preview && (
            <div className="file-preview-container">
              <img
                src={files[0].preview}
                alt="Preview"
                className="file-preview"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/file-icon.png';
                }}
              />
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={() => processOCR(false)}
              disabled={isProcessing}
              className={`process-btn ${isProcessing ? 'processing' : ''}`}
            >
              {isProcessing ? <><span className="spinner"></span> Processing...</> : 'Extract Text'}
            </button>

            <button onClick={clearAll} className="process-btn" disabled={isProcessing}>
              Clear
            </button>
          </div>
        </div>
      )}

      {extractedText && (
        <div className="text-output-container">
          <div className="section-header">
            <h3>Raw Extracted Text</h3>
            <button
              onClick={() => navigator.clipboard.writeText(extractedText)}
              className="copy-btn"
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
          <div className="text-output">
            {extractedText.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {parsedDTRs.length > 0 && (
        <div className="parsed-data">
          <h3>Extracted DTR Info</h3>
          {parsedDTRs.map((dtr, index) => (
            <div key={index} className="dtr-entry">
              <h4>DTR {index + 1}</h4>
              <table className="details-table">
                <tbody>
                  {Object.entries(dtr).filter(([key]) => key !== 'dailyRecords').map(([key, value]) => (
                    <tr key={key}>
                      <td className="key-column">{key}:</td>
                      <td className="value-column">{renderValue(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {dtr.dailyRecords && dtr.dailyRecords.length > 0 && (
                <>
                  <h5>Daily Records</h5>
                  <table className="daily-records-table">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>AM Arrival</th>
                        <th>AM Departure</th>
                        <th>PM Arrival</th>
                        <th>PM Departure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dtr.dailyRecords.map((record, idx) => (
                        <tr key={idx}>
                          <td>{record.day}</td>
                          <td>{record.am_arrival || 'N/A'}</td>
                          <td>{record.am_departure || 'N/A'}</td>
                          <td>{record.pm_arrival || 'N/A'}</td>
                          <td>{record.pm_departure || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
  onClick={async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      toast.error('Login required to compute salary.');
      return;
    }
    const { username } = JSON.parse(storedUser);
    const selectedMonth = dtr.month;

    try {
      await axios.post('http://localhost:8000/compute_salary', {
        username,
        month: selectedMonth
      });

      toast.success('Salary computed successfully! Redirecting to Reports...');
      setTimeout(() => {
        window.location.href = '/reports'; // Adjust if your route is different
      }, 2000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to compute salary.');
    }
  }}
  className="compute-btn"
>
  Compute Salary
</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default UploadPage;

import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import '../App.css';

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Clean up object URLs
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
    setParsedData(null);

    if (acceptedFiles.length > 0) {
      const validFiles = acceptedFiles.filter(file => {
        const isValid = file.type.match('image.*') || file.type === 'application/pdf';
        if (!isValid) {
          setError(`Invalid file type: ${file.name}. Only images and PDFs are allowed.`);
        }
        return isValid;
      });

      if (validFiles.length > 0) {
        // Add preview only (without modifying the original File object)
        const file = validFiles[0];
        file.preview = file.type.match('image.*') ? URL.createObjectURL(file) : null;
        setFiles([file]);  // Only allow one file
      }
    }
  };

  const processOCR = async () => {
    if (files.length === 0) {
      return setError('Please select a file first');
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await axios.post('http://localhost:8000/ocr', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (res.data) {
        setExtractedText(res.data.text || '');
        setParsedData(res.data.parsedData || null);
        setSuccess('Text extracted successfully!');
      } else {
        throw new Error('Received empty response from server');
      }
    } catch (err) {
      let errorMessage = 'OCR processing failed';

      if (err.response) {
        if (err.response.data && err.response.data.detail) {
          if (Array.isArray(err.response.data.detail)) {
            errorMessage = err.response.data.detail.map(d => d.msg).join('. ');
          } else if (typeof err.response.data.detail === 'object') {
            errorMessage = JSON.stringify(err.response.data.detail);
          } else {
            errorMessage = err.response.data.detail.toString();
          }
        } else {
          errorMessage = err.response.statusText || 'Server error occurred';
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = err.message || 'Error setting up OCR request';
      }

      setError(errorMessage);
      console.error('OCR Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/*': ['.png', '.jpg', '.jpeg'], 
      'application/pdf': ['.pdf'] 
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const clearAll = () => {
    setFiles([]);
    setExtractedText('');
    setParsedData(null);
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

      <div 
        {...getRootProps()} 
        className={`drop-zone ${isDragActive ? 'active' : ''} ${files.length > 0 ? 'has-file' : ''}`}
      >
        <input {...getInputProps()} />
        {files.length > 0 ? (
          <p>File ready: {files[0].name}</p>
        ) : (
          <p>Drag & drop a DTR (image or PDF) here, or click to select</p>
        )}
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
              onClick={processOCR} 
              disabled={isProcessing} 
              className={`process-btn ${isProcessing ? 'processing' : ''}`}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span> Processing...
                </>
              ) : (
                'Extract Text'
              )}
            </button>
            
            <button 
              onClick={clearAll} 
              className="process-btn"
              disabled={isProcessing}
            >
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

      {parsedData && (
        <div className="parsed-data">
          <h3>Extracted DTR Info</h3>
          <table className="details-table">
            <tbody>
              {Object.entries(parsedData).map(([key, value]) => (
                <tr key={key}>
                  <td className="key-column">{key}:</td>
                  <td className="value-column">{renderValue(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UploadPage;

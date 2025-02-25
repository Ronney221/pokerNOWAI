// src/Notes.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';
import { API_URL } from './config/api';
import { getUserPokerLogs, uploadPokerLogs } from './services/analytics';
import './index.css';

const FullLogUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const { currentUser } = useAuth();

  const onDrop = useCallback((acceptedFiles) => {
    // Filter for .csv files and check file sizes
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
    const csvFiles = acceptedFiles.filter(file => {
      if (!file.name.endsWith('.csv')) {
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum file size is 5MB.`);
        return false;
      }
      return true;
    });
    
    if (csvFiles.length !== acceptedFiles.length) {
      toast.warning('Some files were ignored. Only CSV files under 5MB are accepted.');
    }

    // Validate and process each file
    const processFiles = async () => {
      const validFiles = [];
      
      for (const file of csvFiles) {
        try {
          // Read file content to validate
          const content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
          });

          // Check if it's a valid PokerNow log file
          const lines = content.split('\n');
          const isPokerNowLog = lines.some(line => 
            line.includes('"-- starting hand #') || 
            line.includes('(No Limit Texas Hold\'em)')
          );

          if (!isPokerNowLog) {
            toast.error(`${file.name} is not a valid PokerNow log file`);
            continue;
          }

          // Extract game date from the first timestamp found
          let gameDate = new Date();
          for (const line of lines) {
            const match = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            if (match) {
              gameDate = new Date(match[0]);
              break;
            }
          }

          // Create file object with display name and metadata
          const fileWithDisplay = new File([file], file.name, {
            type: file.type,
            lastModified: file.lastModified,
          });

          // Add custom properties
          Object.defineProperties(fileWithDisplay, {
            displayName: {
              value: file.name,
              writable: true
            },
            gameDate: {
              value: gameDate,
              writable: false
            },
            content: {
              value: content,
              writable: false
            }
          });

          validFiles.push(fileWithDisplay);
        } catch (error) {
          toast.error(`Error processing ${file.name}: ${error.message}`);
        }
      }

      if (validFiles.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...validFiles]);
        toast.success(`Successfully added ${validFiles.length} file(s)`);
      }
    };

    processFiles();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: true
  });

  const removeFile = (fileToRemove) => {
    setFiles(files.filter(file => file !== fileToRemove));
    if (editingFile === fileToRemove) {
      setEditingFile(null);
      setNewFileName('');
    }
  };

  const startEditing = (file) => {
    setEditingFile(file);
    setNewFileName(file.displayName.replace('.csv', ''));
  };

  const handleRename = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      toast.error('File name cannot be empty');
      return;
    }

    setFiles(prevFiles => prevFiles.map(file => {
      if (file === editingFile) {
        // Create new file object with original content
        const newFile = new File([file], file.name, {
          type: file.type,
          lastModified: file.lastModified,
        });

        // Copy all custom properties
        Object.defineProperties(newFile, {
          displayName: {
            value: newFileName.trim() + '.csv',
            writable: true
          },
          gameDate: {
            value: file.gameDate,
            writable: false
          },
          content: {
            value: file.content,
            writable: false
          }
        });
        return newFile;
      }
      return file;
    }));

    setEditingFile(null);
    setNewFileName('');
  };

  const handleUpload = async () => {
    if (!currentUser) {
      toast.error('Please log in to upload files');
      return;
    }

    if (files.length === 0) {
      toast.warning('Please select files to upload');
      return;
    }

    setUploading(true);

    try {
      const fileContents = files.map(file => ({
        name: file.displayName || file.name,
        content: file.content,
        gameDate: file.gameDate
      }));

      const data = await uploadPokerLogs(fileContents, currentUser.uid);

      if (data.success) {
        toast.success('Files uploaded successfully!');
        setFiles([]);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error(error.message || 'Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-3">
            <div className="badge badge-primary badge-outline p-3 font-medium text-sm mb-4">Coming Soon</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Analyze Your Poker Sessions
          </h1>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Upload your complete hand history logs to unlock powerful insights about your gameplay.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="card bg-base-100 shadow-xl overflow-hidden">
            <div className="p-8">
              {/* Instructions */}
              <div className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How to Get Your Log Files
                </h2>
                <div className="pl-8 space-y-2">
                  <ol className="list-decimal ml-5 space-y-3">
                    <li className="text-base-content/90">Go to your pokernow.com game room</li>
                    <li className="text-base-content/90">Click on <span className="font-medium">LOG/LEDGER</span> in the bottom right</li>
                    <li className="text-base-content/90">Click <span className="font-medium">DOWNLOAD FULL LOG</span> from the bottom right</li>
                  </ol>
                  <div className="mt-4 p-3 bg-warning/10 border-l-4 border-warning rounded-r-lg">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="text-sm text-base-content/80">
                        <p className="font-medium mb-1">Important Notes:</p>
                        <ul className="list-disc ml-5 space-y-1">
                          <li>Logs expire after 5 days</li>
                          <li>Files are limited to 20,000 lines</li>
                          <li>Maximum file size: 5MB per file</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
                  ${isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-base-content/20 hover:border-primary/40 hover:bg-base-200/50'}`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/10' : 'bg-base-200'} transition-colors duration-300`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-14 w-14 ${isDragActive ? 'text-primary' : 'text-base-content/40'} transition-colors duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold">
                      {isDragActive ? 'Drop your files here' : 'Drag & drop your log files'}
                    </p>
                    <p className="text-base-content/60">or click to select files</p>
                  </div>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Selected Files ({files.length})
                    </h3>
                    <button 
                      onClick={() => setFiles([])}
                      className="btn btn-sm btn-ghost text-error"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="space-y-3 mb-8">
                    {files.map((file, index) => (
                      <div key={index} className="card bg-base-200 hover:shadow-md transition-all">
                        <div className="card-body p-5">
                          {editingFile === file ? (
                            <form onSubmit={handleRename} className="flex-1 flex gap-2 items-center">
                              <input
                                type="text"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                className="input input-bordered flex-1"
                                autoFocus
                              />
                              <span className="opacity-50">.csv</span>
                              <div className="flex gap-2">
                                <button type="submit" className="btn btn-sm btn-success">
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingFile(null);
                                    setNewFileName('');
                                  }}
                                  className="btn btn-sm btn-ghost"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-medium text-lg truncate" title={file.displayName}>
                                    {file.displayName}
                                  </h3>
                                  <div className="text-sm text-base-content/70 mt-1 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Game Date: {file.gameDate.toLocaleDateString()} {file.gameDate.toLocaleTimeString()}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startEditing(file)}
                                    className="btn btn-sm btn-outline"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => removeFile(file)}
                                    className="btn btn-sm btn-outline btn-error"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="loading loading-spinner loading-md"></span>
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      `Upload ${files.length} File${files.length > 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              )}
              
              {/* Login Message for non-logged in users */}
              {!currentUser && (
                <div className="mt-8 p-6 bg-base-200 rounded-xl border border-base-300">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-semibold mb-2">Create an Account to Upload Logs</h3>
                      <p className="text-base-content/70 mb-4">
                        Sign up for a free account to upload and analyze your poker game logs. Get personalized insights and track your progress over time.
                      </p>
                      <div className="flex gap-4 justify-center md:justify-start">
                        <a href="/login" className="btn btn-outline">Sign In</a>
                        <a href="/register" className="btn btn-primary">Create Account</a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullLogUpload;

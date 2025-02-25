// src/Notes.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';
import { API_URL } from './config/urls';
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

      const response = await fetch(`${API_URL}/analysis/upload-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: fileContents,
          userId: currentUser.uid
        }),
      });

      const data = await response.json();

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 md:p-6">
        <div className="mockup-window bg-base-300 border shadow-lg">
          <div className="bg-base-200 p-4 sm:p-8 md:p-16">
            <div className="flex flex-col space-y-6">
              <div className="text-center space-y-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text">
                  Upload Your Poker Logs
                </h1>
                <p className="text-sm sm:text-base md:text-lg opacity-80 leading-relaxed">
                  To get your log files:
                  <ol className="list-decimal list-inside mt-2 text-left max-w-md mx-auto">
                    <li>Go to your pokernow.com game room</li>
                    <li>Click on LOG/LEDGER in the bottom right</li>
                    <li>Click "DOWNLOAD FULL LOG" from the bottom right</li>
                  </ol>
                  <p className="mt-2 text-warning text-sm">
                    Note: Logs expire after 5 days and are limited to 20,000 lines.<br/>
                    Maximum file size: 5MB per file.
                  </p>
                </p>
              </div>

              {/* Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/10' : 'border-base-content/20 hover:border-primary/50'}`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
                    </p>
                    <p className="text-sm opacity-70">or click to select files</p>
                  </div>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Selected Files:</h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex flex-col bg-base-300 p-3 rounded-lg">
                        {editingFile === file ? (
                          <form onSubmit={handleRename} className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              className="input input-sm flex-1"
                              autoFocus
                            />
                            <span className="opacity-50">.csv</span>
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
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="truncate flex-1 font-medium">{file.displayName}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditing(file)}
                                  className="btn btn-ghost btn-sm"
                                >
                                  Rename
                                </button>
                                <button
                                  onClick={() => removeFile(file)}
                                  className="btn btn-ghost btn-sm text-error"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <div className="text-sm opacity-70 mt-1">
                              Game Date: {file.gameDate.toLocaleDateString()} {file.gameDate.toLocaleTimeString()}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn btn-primary w-full"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullLogUpload;

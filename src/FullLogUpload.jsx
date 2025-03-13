// src/FullLogUpload.jsx
import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransitionVariants, containerVariants, itemVariants } from './animations/pageTransitions';
import './index.css';

function FullLogUpload() {
  const { currentUser } = useAuth();
  const [playerName, setPlayerName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // API base URL
  const apiBase = import.meta.env.VITE_HEROKU || 'http://127.0.0.1:5000';

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError('');
      setUploadSuccess(false);
      toast.success('CSV file selected successfully!');
    } else {
      setFile(null);
      setError('Please select a valid CSV file');
      toast.error('Please select a valid CSV file');
    }
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError('');
      setUploadSuccess(false);
      toast.success('CSV file dropped successfully!');
    } else {
      setError('Please provide a valid CSV file');
      toast.error('Please provide a valid CSV file');
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file || !playerName || !currentUser) {
      setError('Please provide a player name and CSV file, and ensure you are logged in.');
      toast.error('Please provide all required information');
      return;
    }
    
    setError('');
    setLoading(true);
    setUploadProgress('Preparing upload...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('player_name', playerName);
    formData.append('identifier', currentUser.uid);

    try {
      setUploadProgress('Uploading file...');
      const response = await fetch(`${apiBase}/api/process_csv`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response) {
        throw new Error('No response received from server');
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (data.success) {
        setUploadSuccess(true);
        setUploadProgress('Analysis completed!');
        localStorage.setItem('lastAnalysisId', data.identifier);
        localStorage.setItem('lastPlayerName', data.player_name);
        toast.success('File processed successfully! Ready to view analytics.');
      } else if (data.error) {
        if (data.error.includes('Database storage failed')) {
          toast.warning('Analysis completed but could not be saved. Please try again.');
        } else {
          throw new Error(data.error);
        }
      } else {
        throw new Error('Unknown error occurred');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.toString());
      toast.error(`Error uploading file: ${err.toString()}`);
      setUploadSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = () => {
    const identifier = localStorage.getItem('lastAnalysisId');
    const playerName = localStorage.getItem('lastPlayerName');
    
    if (identifier) {
      window.location.href = `/analytics?id=${identifier}&player=${playerName}`;
    } else {
      window.location.href = '/analytics';
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
      className="min-h-screen bg-gradient-to-b from-base-100 to-base-200/50 pt-32 pb-20"
    >
      <div className="container mx-auto px-4">
        {/* Hero Header */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            Upload Poker Log
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-lg opacity-80 max-w-2xl mx-auto"
          >
            Upload your PokerNow CSV log file to analyze your game, track statistics, and improve your poker strategy.
          </motion.p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          className="max-w-5xl mx-auto"
        >
          <div className="card">
            <div className="p-8">
              {!currentUser ? (
                <div className="alert alert-warning justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="font-medium">Please log in to upload and analyze poker logs</span>
                    <a href="/login" className="btn btn-primary btn-sm mt-2">Log In</a>
                  </div>
                </div>
              ) : !uploadSuccess ? (
                <div className="space-y-10">
                  {/* Step 1: Enter Player Name */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">Enter Your Player Name</h2>
                        <p className="text-base-content/70 mt-1">This should match your name in the CSV file</p>
                      </div>
                    </div>
                    
                    <div className="form-control">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="input input-bordered w-full max-w-md"
                        placeholder="Enter your PokerNow player name"
                        disabled={loading}
                      />
                      <label className="label">
                        <span className="label-text-alt text-base-content/60">
                          Your name will be used to calculate your top 10 most winning / losing hands
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Step 2: Upload CSV */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">Upload Game Log</h2>
                        <p className="text-base-content/70 mt-1">Export your game log from PokerNow and upload the CSV file</p>
                      </div>
                    </div>

                    <div 
                      className={`group relative overflow-hidden rounded-2xl transition-all duration-300
                        ${isDragging 
                          ? 'bg-primary/5 border-primary border-opacity-50' 
                          : 'bg-base-200/50 hover:bg-base-200 border-base-300'
                        } 
                        border-2 border-dashed cursor-pointer`}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {/* Upload Animation */}
                      <div className={`absolute inset-0 bg-primary/5 transition-transform duration-700 ease-out
                        ${isDragging ? 'translate-y-0' : 'translate-y-full'}`} />
                      
                      <div className="relative z-10 flex flex-col items-center px-6 py-16">
                        <div className="w-20 h-20 mb-6">
                          <motion.div 
                            animate={isDragging ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`w-full h-full rounded-2xl flex items-center justify-center
                              ${isDragging ? 'bg-primary/10 text-primary' : 'bg-base-300/50 text-base-content/40'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </motion.div>
                        </div>

                        <div className="text-center max-w-sm">
                          <motion.div
                            animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
                            className="text-xl font-medium mb-2"
                          >
                            {file ? file.name : (isDragging ? 'Drop to upload' : 'Drop your CSV file here')}
                          </motion.div>
                          <p className="text-base-content/60 mb-4">or click to browse</p>
                          
                          {/* Required Info */}
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base-200/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-base-content/70">
                              Only .csv files exported from PokerNow are supported
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        className="hidden" 
                        accept=".csv" 
                        onChange={handleFileChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Upload Button */}
                  <div className="flex justify-center pt-6 border-t border-base-200">
                    {loading ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="loading loading-spinner loading-lg text-primary"></div>
                        <p className="text-base-content/80">{uploadProgress}</p>
                      </div>
                    ) : (
                      <motion.button 
                        onClick={handleUpload}
                        disabled={loading || !file || !playerName}
                        className="btn btn-primary btn-lg gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Upload & Analyze
                      </motion.button>
                    )}
                  </div>

                  {error && (
                    <div className="mt-6">
                      <div className="alert alert-error">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h3 className="font-bold">Error</h3>
                          <div className="text-sm">{error}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div 
                  className="flex flex-col items-center gap-6 py-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="text-center space-y-4">
                    <motion.div 
                      className="text-success"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </motion.div>
                    <h3 className="text-2xl font-bold">Analysis Complete!</h3>
                    <p className="text-base-content/70">Your poker log has been processed and is ready for analysis.</p>
                  </div>
                  
                  <motion.button 
                    onClick={handleViewAnalytics}
                    className="btn btn-primary btn-lg gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Analytics
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default FullLogUpload;
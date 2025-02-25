const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const Analysis = require('../models/Analysis');
const Ledger = require('../models/Ledger');
const { spawn } = require('child_process');
const path = require('path');
const PokerLog = require('../models/PokerLog');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Upload and analyze poker data
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { firebaseUid } = req.body;
    if (!firebaseUid) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Find user
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create analysis record
    const analysis = new Analysis({
      userId: user._id,
      originalFileName: req.file.originalname,
      status: 'processing'
    });
    await analysis.save();

    // Add analysis to user's analyses array
    user.analyses.push(analysis._id);
    await user.save();

    // Start Python analysis process
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../scripts/analyze_poker.py'),
      req.file.path
    ]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      try {
        if (code === 0 && outputData) {
          // Update analysis with results
          analysis.results = JSON.parse(outputData);
          analysis.status = 'completed';
          await analysis.save();
        } else {
          analysis.status = 'error';
          analysis.errorMessage = errorData || 'Analysis failed';
          await analysis.save();
        }
      } catch (error) {
        console.error('Error processing analysis results:', error);
        analysis.status = 'error';
        analysis.errorMessage = 'Error processing analysis results';
        await analysis.save();
      }
    });

    res.status(202).json({ 
      message: 'Analysis started',
      analysisId: analysis._id
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get analysis status
router.get('/:analysisId', async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all analyses for a user
router.get('/user/:firebaseUid', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const analyses = await Analysis.find({ userId: user._id })
      .sort({ analysisDate: -1 });
    
    res.json({ analyses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload poker logs
router.post('/upload-logs', async (req, res) => {
  try {
    const { files, userId } = req.body;
    
    if (!files || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const savedLogs = [];
    const errors = [];

    for (const file of files) {
      try {
        // Basic validation
        if (!file.content || !file.name) {
          errors.push(`Invalid file data for ${file.name || 'unnamed file'}`);
          continue;
        }

        // Extract date from file content (you might need to adjust this based on the actual file format)
        const gameDate = new Date(); // TODO: Extract actual date from file content

        const pokerLog = new PokerLog({
          userId,
          fileName: file.name,
          fileContent: file.content,
          gameDate
        });

        const savedLog = await pokerLog.save();
        savedLogs.push(savedLog);
      } catch (error) {
        errors.push(`Error processing ${file.name}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      savedLogs,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error uploading poker logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's poker logs
router.get('/logs/:userId', async (req, res) => {
  try {
    const logs = await PokerLog.find({ userId: req.params.userId })
      .select('-fileContent') // Exclude the file content from the response
      .sort('-uploadDate');
    
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save ledger data
router.post('/save-ledger', async (req, res) => {
  try {
    const { firebaseUid, sessionName, players, transactions, originalFileName } = req.body;
    
    if (!firebaseUid || !transactions || !transactions.length) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: { 
          firebaseUid: !firebaseUid, 
          transactions: !transactions || !transactions.length 
        } 
      });
    }

    // Find user
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Process transactions to make sure amounts are numbers
    const processedTransactions = transactions.map(tx => ({
      from: tx.from,
      to: tx.to,
      amount: parseFloat(tx.amount)
    }));

    // Create ledger record
    const ledger = new Ledger({
      userId: user._id,
      firebaseUid,
      sessionName: sessionName || 'Poker Session',
      sessionDate: new Date(),
      players: players || [],
      transactions: processedTransactions,
      originalFileName
    });

    await ledger.save();

    res.status(201).json({ 
      success: true,
      message: 'Ledger data saved successfully',
      ledgerId: ledger._id
    });

  } catch (error) {
    console.error('Error saving ledger data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all ledgers for a user
router.get('/ledgers/:firebaseUid', async (req, res) => {
  try {
    const ledgers = await Ledger.findByFirebaseUid(req.params.firebaseUid)
      .select('-players.aliases'); // Exclude aliases to reduce response size
    
    res.json({ ledgers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific ledger by ID
router.get('/ledger/:ledgerId', async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.ledgerId);
    if (!ledger) {
      return res.status(404).json({ error: 'Ledger not found' });
    }
    
    res.json({ ledger });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get publicly shared ledger by ID (no authentication required)
router.get('/shared-ledger/:ledgerId', async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.ledgerId);
    if (!ledger) {
      return res.status(404).json({ error: 'Shared ledger not found' });
    }
    
    // Return the ledger with just the necessary information for public viewing
    // This approach avoids exposing sensitive data if any exists
    const publicLedger = {
      _id: ledger._id,
      sessionName: ledger.sessionName,
      sessionDate: ledger.sessionDate,
      players: ledger.players.map(player => ({
        name: player.name,
        buyIn: player.buyIn,
        cashOut: player.cashOut
      })),
      transactions: ledger.transactions
    };
    
    res.json({ ledger: publicLedger });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete ledger by ID
router.delete('/ledger/:ledgerId', async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.ledgerId);
    if (!ledger) {
      return res.status(404).json({ error: 'Ledger not found' });
    }
    
    // Optional: Check if the user has permission to delete this ledger
    // if (req.body.firebaseUid && ledger.firebaseUid !== req.body.firebaseUid) {
    //   return res.status(403).json({ error: 'You do not have permission to delete this ledger' });
    // }
    
    await Ledger.findByIdAndDelete(req.params.ledgerId);
    
    res.json({ 
      success: true, 
      message: 'Ledger deleted successfully',
      deletedId: req.params.ledgerId
    });
  } catch (error) {
    console.error('Error deleting ledger:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
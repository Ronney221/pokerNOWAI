const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables from root .env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Verify environment variables are loaded
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  console.error('Looking for .env file at:', envPath);
  process.exit(1);
}

// Log environment variables (excluding sensitive data)
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('MongoDB connection:', process.env.MONGODB_URI ? 'Configured' : 'Missing');

const app = express();

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://pokernowai.com']
  : ['http://localhost:5173']; 

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

// MongoDB Connection with Mongoose
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Successfully connected to MongoDB.');
  // Log connection details for debugging
  console.log('MongoDB connection state:', mongoose.connection.readyState);
  console.log('MongoDB host:', mongoose.connection.host);
  console.log('MongoDB database:', mongoose.connection.name);
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
  console.error('Connection string used:', process.env.MONGODB_URI.replace(/:[^:/@]+@/, ':****@')); // Hide password
  process.exit(1);
});

// Initialize routes
const userRoutes = require('./routes/users');
const analysisRoutes = require('./routes/analysis');

app.use('/api/users', userRoutes);
app.use('/api/analysis', analysisRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Add console.logs to debug
app.post('/api/users/saveUserData', async (req, res) => {
  console.log('=== START saveUserData request ===');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  try {
    // ... your code
    console.log('Data saved successfully');
  } catch (error) {
    console.error('=== ERROR in saveUserData ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    console.error('=== END ERROR ===');
    res.status(500).json({ 
      error: 'Something went wrong!',
      details: error.message,
      code: error.code
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== Global Error Handler ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);
  console.error('Request headers:', req.headers);
  console.error('Request body:', req.body);
  console.error('=== End Global Error Handler ===');
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: err.message,
    code: err.code
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle cleanup on server shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
}); 
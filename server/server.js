const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');

// Load environment variables from root .env
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Debug environment variables (without exposing secrets)
console.log('Environment Variables Check:', {
  NODE_ENV: process.env.NODE_ENV,
  VITE_STRIPE_SECRET_KEY_EXISTS: !!process.env.VITE_STRIPE_SECRET_KEY,
  VITE_STRIPE_PUBLIC_KEY_EXISTS: !!process.env.VITE_STRIPE_PUBLIC_KEY,
  VITE_STRIPE_PRICE_ID_EXISTS: !!process.env.VITE_STRIPE_PRICE_ID,
  VITE_STRIPE_WEBHOOK_SECRET_DEV_EXISTS: !!process.env.VITE_STRIPE_WEBHOOK_SECRET_DEV,
  MONGODB_URI_EXISTS: !!process.env.MONGODB_URI
});

// Initialize Stripe with explicit error handling
let stripe;
try {
  if (!process.env.VITE_STRIPE_SECRET_KEY) {
    throw new Error('VITE_STRIPE_SECRET_KEY is not defined in environment variables');
  }
  stripe = require('stripe')(process.env.VITE_STRIPE_SECRET_KEY);
  console.log('Stripe initialized successfully');
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
  process.exit(1);
}

// Set Mongoose options
mongoose.set('strictQuery', false);
mongoose.set('debug', process.env.NODE_ENV === 'development');

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
const port = process.env.PORT || 5000;

// CORS configuration for development and production
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:4173',  // Vite preview
  'https://pokernowai.vercel.app', // Production URL
  'https://www.pokernowai.vercel.app',
  'https://pokernowai.com'
];

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'stripe-signature']
}));

// Webhook endpoint must come before body parser
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.VITE_STRIPE_WEBHOOK_SECRET_DEV;

  if (!endpointSecret) {
    console.error('⚠️ Webhook secret not found:', {
      exists: !!process.env.VITE_STRIPE_WEBHOOK_SECRET_DEV,
      headers: req.headers
    });
    return res.status(500).send('Webhook secret not configured');
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verified for event:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', {
      error: err.message,
      signature: sig?.slice(0, 20) + '...',
      secret: endpointSecret ? 'present' : 'missing',
      secretLength: endpointSecret?.length
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log the event for testing
  console.log('🎉 Received webhook event:', {
    type: event.type,
    id: event.id,
    timestamp: new Date().toISOString()
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('💳 Processing checkout session:', {
          sessionId: session.id,
          customerId: session.customer,
          amount: session.amount_total,
          status: session.payment_status,
          clientReferenceId: session.client_reference_id
        });
        await fulfillCheckout(session.id);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('💰 Payment intent succeeded:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status
        });
        break;

      case 'product.created':
      case 'price.created':
        console.log(`📦 ${event.type}:`, event.data.object);
        break;

      case 'charge.succeeded':
      case 'charge.updated':
        console.log(`💵 ${event.type}:`, {
          id: event.data.object.id,
          amount: event.data.object.amount,
          status: event.data.object.status
        });
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Error processing webhook:', err);
    res.status(500).json({ error: err.message });
  }
});

// Body parsing middleware - must come after webhook route
app.use(express.json({ limit: '5mb' }));

// Stripe Checkout Routes
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userId, email } = req.body;
    
    // Debug log
    console.log('Received checkout session request:', {
      priceId,
      userId,
      email,
      headers: req.headers,
      body: req.body,
      stripeInitialized: !!stripe,
      stripeKeyLength: process.env.VITE_STRIPE_SECRET_KEY ? process.env.VITE_STRIPE_SECRET_KEY.length : 0
    });

    // Validate required fields
    if (!priceId || !userId || !email) {
      console.error('Missing required fields:', { priceId, userId, email });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        received: { priceId, userId, email }
      });
    }

    // Validate Stripe initialization
    if (!stripe) {
      throw new Error('Stripe is not properly initialized');
    }

    console.log('Creating Stripe checkout session with:', {
      customer_email: email,
      client_reference_id: userId,
      price: priceId
    });

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      payment_method_types: ['card'],
      customer_email: email,
      client_reference_id: userId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      return_url: `${process.env.NODE_ENV === 'production' 
        ? 'https://pokernowai.com' 
        : 'http://localhost:5173'}/payment/return?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId: userId
      }
    });

    console.log('Created Stripe session:', {
      clientSecret: session.client_secret ? 'present' : 'missing',
      sessionId: session.id,
      url: session.url,
      mode: session.mode,
      paymentStatus: session.payment_status
    });

    res.json({
      success: true,
      clientSecret: session.client_secret,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get('/api/session-status', async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    res.json({
      success: true,
      status: session.status,
      customer_email: session.customer_details?.email,
      subscription: session.subscription
    });
  } catch (error) {
    console.error('Error retrieving session status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

async function fulfillCheckout(sessionId) {
  console.log('Fulfilling Checkout Session:', sessionId);

  try {
    // Retrieve the Checkout Session with expanded line items
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items']
    });

    // Find the user to check if fulfillment was already performed
    const user = await User.findOne({ firebaseUid: session.client_reference_id });
    
    if (!user) {
      console.error('User not found:', session.client_reference_id);
      return;
    }

    // Check if this session was already fulfilled
    if (user.lastPayment && user.lastPayment.paymentIntent === session.payment_intent) {
      console.log('Session already fulfilled:', sessionId);
      return;
    }

    // Only fulfill if payment is not unpaid
    if (session.payment_status !== 'unpaid') {
      // Update user's premium status
      user.isPremium = true;
      user.premiumSince = user.premiumSince || new Date();
      user.stripeCustomerId = session.customer;
      
      // Record payment details
      user.lastPayment = {
        date: new Date(),
        amount: session.amount_total,
        currency: session.currency,
        paymentIntent: session.payment_intent,
        sessionId: session.id // Store session ID for reference
      };

      // If user was in trial, end it
      if (user.isTrialActive) {
        user.isTrialActive = false;
        user.trialEndDate = new Date();
      }

      await user.save();
      
      console.log('Successfully fulfilled checkout session:', {
        sessionId,
        userId: user.firebaseUid,
        isPremium: user.isPremium,
        premiumSince: user.premiumSince,
        stripeCustomerId: user.stripeCustomerId
      });
    } else {
      console.log('Session payment status is unpaid:', sessionId);
    }
  } catch (error) {
    console.error('Error fulfilling checkout:', error);
    throw error;
  }
}

// MongoDB Connection with Mongoose
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4, skip trying IPv6
})
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

// Test Stripe price route
app.get('/api/test-price', async (req, res) => {
  try {
    const priceId = req.query.priceId || process.env.STRIPE_PRICE_ID;
    
    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'No price ID provided'
      });
    }

    // Try to retrieve the price from Stripe
    const price = await stripe.prices.retrieve(priceId);
    
    res.json({
      success: true,
      price: {
        id: price.id,
        currency: price.currency,
        unit_amount: price.unit_amount,
        product: price.product,
        active: price.active
      }
    });
  } catch (error) {
    console.error('Error retrieving price:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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

// Test endpoint to verify server is running
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = require('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        server.listen(++startPort);
      } else {
        reject(err);
      }
    });
    
    server.on('listening', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    
    server.listen(startPort);
  });
};

// Start server with port handling
const startServer = async () => {
  try {
    let serverPort = port;
    
    try {
      serverPort = await findAvailablePort(port);
      if (serverPort !== port) {
        console.log(`⚠️ Port ${port} was in use, using port ${serverPort} instead`);
      }
    } catch (err) {
      console.error('Error finding available port:', err);
      process.exit(1);
    }

    app.listen(serverPort, () => {
      console.log(`
🚀 Server is running on port ${serverPort}
📍 Local webhook URL: http://localhost:${serverPort}/api/webhook
🔧 To test webhooks, run:
   stripe listen --forward-to localhost:${serverPort}/api/webhook

💡 Then in another terminal, trigger test events with:
   stripe trigger checkout.session.completed

📌 Environment: ${process.env.NODE_ENV}
📊 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}
      `);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle cleanup on server shutdown
process.on('SIGINT', async () => {
  try {
  await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
  process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}); 
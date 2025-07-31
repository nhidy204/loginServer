const express = require('express');
const path = require('path');
const config = require('./config/environment');
const { connectDB } = require('./config/database');
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.corsOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Backward compatibility routes
app.post('/login', (req, res) => {
  const AuthController = require('./controllers/authController');
  AuthController.login(req, res);
});

app.post('/refresh', (req, res) => {
  const AuthController = require('./controllers/authController');
  AuthController.refresh(req, res);
});

app.get('/protected', (req, res) => {
  const AuthController = require('./controllers/authController');
  const { authenticateToken } = require('./middleware/auth');
  
  // Apply middleware manually
  authenticateToken(req, res, () => {
    AuthController.getProtectedData(req, res);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// 404 
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server is running on port ${config.port}`);
  console.log(`📁 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Health check: http://localhost:${config.port}/health`);
});

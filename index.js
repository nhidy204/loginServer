const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json()); 

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Store refresh tokens (in production, use database)
let refreshTokens = [];

const user = {
  username: 'admin',
  password: '123456',
};

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === user.username && password === user.password) {
    const accessToken = 'fake_access_token_' + Date.now();
    const refreshToken = 'fake_refresh_token_' + Date.now();

    // Store refresh token
    refreshTokens.push(refreshToken);

    return res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
    });
  }

  res.status(401).json({ message: 'Invalid credentials' });
});

// Add refresh token endpoint
app.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  // Check if refresh token exists
  if (refreshTokens.includes(refreshToken)) {
    const newAccessToken = 'fake_access_token_' + Date.now();
    const newRefreshToken = 'fake_refresh_token_' + Date.now();

    // Remove old refresh token and add new one
    const index = refreshTokens.indexOf(refreshToken);
    if (index > -1) {
      refreshTokens.splice(index, 1);
    }
    refreshTokens.push(newRefreshToken);

    return res.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  }

  res.status(401).json({ message: 'Invalid refresh token' });
});

// Logout endpoint
app.post('/logout', (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const index = refreshTokens.indexOf(refreshToken);
    if (index > -1) {
      refreshTokens.splice(index, 1);
    }
  }

  res.json({ message: 'Logged out successfully' });
});

app.get('/protected', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; 

  if (token && token.startsWith('fake_access_token_')) {
    res.json({ message: 'You are authorized!' });
  } else {
    res.status(403).json({ message: 'Forbidden - Invalid token' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

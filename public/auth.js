// Token management functions
const TokenManager = {
  // Store tokens in localStorage
  storeTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('tokenExpiry', Date.now() + (15 * 60 * 1000)); // 15'
  },

  // Get stored tokens
  getTokens() {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      tokenExpiry: localStorage.getItem('tokenExpiry')
    };
  },

  // Check if token is expired
  isTokenExpired() {
    const expiry = localStorage.getItem('tokenExpiry');
    return !expiry || Date.now() > parseInt(expiry);
  },

  // Clear tokens (logout)
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
  },

  // Refresh access token using refresh token
  async refreshAccessToken() {
    const { refreshToken } = this.getTokens();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.storeTokens(data.data.accessToken, data.data.refreshToken);
      return data.data.accessToken;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  },

  // Make authenticated request with automatic token refresh
  async authenticatedRequest(url, options = {}) {
    let accessToken = this.getTokens().accessToken;

    // Check if token is expired and refresh if needed
    if (this.isTokenExpired() && this.getTokens().refreshToken) {
      try {
        accessToken = await this.refreshAccessToken();
      } catch (error) {
        this.showLogoutMessage();
        throw error;
      }
    }

    // Add authorization header
    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      }
    };

    const response = await fetch(url, authOptions);

    // If 401, try to refresh token once more
    if (response.status === 401 && this.getTokens().refreshToken) {
      try {
        accessToken = await this.refreshAccessToken();
        authOptions.headers['Authorization'] = `Bearer ${accessToken}`;
        return await fetch(url, authOptions);
      } catch (error) {
        this.showLogoutMessage();
        throw error;
      }
    }

    return response;
  },

  // Show logout message
  showLogoutMessage() {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = 'Session expired. Please login again.';
    resultDiv.className = 'result error';
    resultDiv.classList.remove('hidden');
    
    // Clear form
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
  }
};

// Toggle between login and register forms
function toggleForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');
  const resetForm = document.getElementById('reset-form');
  const toggleBtn = document.getElementById('toggle-btn');
  const forgotBtn = document.getElementById('forgot-btn');
  
  // Check current state
  const isLoginVisible = loginForm.style.display !== 'none';
  const isRegisterVisible = registerForm.style.display !== 'none';
  
  // Hide all forms first
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  forgotForm.style.display = 'none';
  resetForm.style.display = 'none';
  
  // Toggle based on current state
  if (isLoginVisible) {
    // Currently showing login, switch to register
    registerForm.style.display = 'block';
    toggleBtn.textContent = 'Sign In';
    forgotBtn.style.display = 'none';
  } else {
    // Currently showing register or other form, switch to login
    loginForm.style.display = 'block';
    toggleBtn.textContent = 'Create Account';
    forgotBtn.style.display = 'inline';
  }
}

// Show forgot password form
function showForgotPassword() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');
  const resetForm = document.getElementById('reset-form');
  const toggleBtn = document.getElementById('toggle-btn');
  const forgotBtn = document.getElementById('forgot-btn');
  
  // Hide all forms
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  forgotForm.style.display = 'block';
  resetForm.style.display = 'none';
  
  toggleBtn.textContent = 'Back to Login';
  forgotBtn.style.display = 'none';
}

// Show reset password form
function showResetPassword() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');
  const resetForm = document.getElementById('reset-form');
  const toggleBtn = document.getElementById('toggle-btn');
  const forgotBtn = document.getElementById('forgot-btn');
  
  // Hide all forms
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  forgotForm.style.display = 'none';
  resetForm.style.display = 'block';
  
  toggleBtn.textContent = 'Back to Login';
  forgotBtn.style.display = 'none';
}

// Check if user is already logged in
function checkLoginStatus() {
  const { accessToken } = TokenManager.getTokens();
  if (accessToken && !TokenManager.isTokenExpired()) {
    showLoggedInState();
  }
}

// Show logged in state
function showLoggedInState() {
  const loginContainer = document.querySelector('.login-container');
  loginContainer.innerHTML = `
    <div class="login-header">
      <h2>Welcome Back!</h2>
      <p>You are already logged in</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <button class="submit-btn" onclick="logout()" style="background: #dc3545;">Logout</button>
    </div>
    <div class="result success">
      <strong>You are logged in!</strong><br>
      Welcome back to your account.
    </div>
  `;
}

// Logout function
function logout() {
  TokenManager.clearTokens();
  location.reload();
}

// Initialize on page load
checkLoginStatus();

// Login form handler
document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const resultDiv = document.getElementById('result');
  const loadingDiv = document.getElementById('loading');
  const submitBtn = document.querySelector('#login-form .submit-btn');

  // Show loading
  loadingDiv.style.display = 'block';
  submitBtn.disabled = true;
  resultDiv.classList.add('hidden');

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // Hide loading
    loadingDiv.style.display = 'none';
    submitBtn.disabled = false;

    if (response.ok) {
      // Store tokens
      TokenManager.storeTokens(data.data.accessToken, data.data.refreshToken);
      
      resultDiv.textContent = 'Successfully logged in! ' + data.message;
      resultDiv.className = 'result success';
      
      // Show success message without tokens
      setTimeout(() => {
        resultDiv.innerHTML = `
          <strong>Login Successful!</strong><br>
          Welcome back, ${data.data.user.username}!<br>
          <button class="submit-btn" onclick="logout()" style="margin-top: 10px; background: #dc3545;">Logout</button>
        `;
      }, 1000);

      // console.log('Access Token:', data.data.accessToken);
      // console.log('Refresh Token:', data.data.refreshToken);
    } else {
      resultDiv.textContent = 'Login failed: ' + data.message;
      resultDiv.className = 'result error';
    }

    // Show result with animation
    setTimeout(() => {
      resultDiv.classList.remove('hidden');
    }, 100);

  } catch (error) {
    loadingDiv.style.display = 'none';
    submitBtn.disabled = false;
    resultDiv.textContent = 'Network error. Please try again.';
    resultDiv.className = 'result error';
    resultDiv.classList.remove('hidden');
    console.error('Error:', error);
  }
});

// Register form handler
document.getElementById('register-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const resultDiv = document.getElementById('result');
  const loadingDiv = document.getElementById('loading');
  const submitBtn = document.querySelector('#register-form .submit-btn');

  // Show loading
  loadingDiv.style.display = 'block';
  submitBtn.disabled = true;
  resultDiv.classList.add('hidden');

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    // Hide loading
    loadingDiv.style.display = 'none';
    submitBtn.disabled = false;

    if (response.ok) {
      resultDiv.textContent = 'Successfully registered! ' + data.message;
      resultDiv.className = 'result success';
      
      // Switch to login form after successful registration
      setTimeout(() => {
        toggleForms();
        resultDiv.innerHTML = `
          <strong>Registration Successful!</strong><br>
          Please sign in with your new account.
        `;
      }, 1000);
    } else {
      resultDiv.textContent = 'Registration failed: ' + data.message;
      resultDiv.className = 'result error';
    }

    // Show result with animation
    setTimeout(() => {
      resultDiv.classList.remove('hidden');
    }, 100);

  } catch (error) {
    loadingDiv.style.display = 'none';
    submitBtn.disabled = false;
    resultDiv.textContent = 'Network error. Please try again.';
    resultDiv.className = 'result error';
    resultDiv.classList.remove('hidden');
    console.error('Error:', error);
  }
});

// Forgot password form handler
document.getElementById('forgot-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('forgot-email').value;
  const resultDiv = document.getElementById('result');
  const loadingDiv = document.getElementById('loading');
  const submitBtn = document.querySelector('#forgot-form .submit-btn');

  // Show loading
  loadingDiv.style.display = 'block';
  submitBtn.disabled = true;
  resultDiv.classList.add('hidden');

  try {
    const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    // Hide loading
    loadingDiv.style.display = 'none';
    submitBtn.disabled = false;

    if (response.ok) {
      // Debug: log response data
      console.log('Forgot password response:', data);
      
      if (data.token) {
        resultDiv.textContent = 'Reset link sent! ' + data.message;
        resultDiv.className = 'result success';
        
        // Show reset form after successful forgot password
        setTimeout(() => {
          showResetPassword();
                  resultDiv.innerHTML = `
          <strong>Reset Link Sent!</strong><br>
          <strong>Reset Token:</strong><br>
          <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all; max-width: 100%; overflow-wrap: break-word;">${data.token}</div>
          Enter the token and new password below.
        `;
        }, 1000);
      } else {
        resultDiv.textContent = 'User not found. Please check your email or register first.';
        resultDiv.className = 'result error';
      }
    } else {
      resultDiv.textContent = 'Failed to send reset link: ' + data.message;
      resultDiv.className = 'result error';
    }

    // Show result with animation
    setTimeout(() => {
      resultDiv.classList.remove('hidden');
    }, 100);

  } catch (error) {
    loadingDiv.style.display = 'none';
    submitBtn.disabled = false;
    resultDiv.textContent = 'Network error. Please try again.';
    resultDiv.className = 'result error';
    resultDiv.classList.remove('hidden');
    console.error('Error:', error);
  }
});

// Reset password form handler
document.getElementById('reset-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const token = document.getElementById('reset-token').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const resultDiv = document.getElementById('result');
  const loadingDiv = document.getElementById('loading');
  const submitBtn = document.querySelector('#reset-form .submit-btn');

  // Validate password confirmation
  if (newPassword !== confirmPassword) {
    resultDiv.textContent = 'Passwords do not match!';
    resultDiv.className = 'result error';
    resultDiv.classList.remove('hidden');
    return;
  }

  // Show loading
  loadingDiv.style.display = 'block';
  submitBtn.disabled = true;
  resultDiv.classList.add('hidden');

  try {
    const response = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    // Hide loading
    loadingDiv.style.display = 'none';
    submitBtn.disabled = false;

    if (response.ok) {
      resultDiv.textContent = 'Password reset successful! ' + data.message;
      resultDiv.className = 'result success';
      
      // Switch to login form after successful reset
      setTimeout(() => {
        toggleForms();
        resultDiv.innerHTML = `
          <strong>Password Reset Successful!</strong><br>
          Please sign in with your new password.
        `;
      }, 1000);
    } else {
      resultDiv.textContent = 'Password reset failed: ' + data.message;
      resultDiv.className = 'result error';
    }

    // Show result with animation
    setTimeout(() => {
      resultDiv.classList.remove('hidden');
    }, 100);

  } catch (error) {
    loadingDiv.style.display = 'none';
    submitBtn.disabled = false;
    resultDiv.textContent = 'Network error. Please try again.';
    resultDiv.className = 'result error';
    resultDiv.classList.remove('hidden');
    console.error('Error:', error);
  }
}); 
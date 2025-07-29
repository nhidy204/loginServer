
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
          const response = await fetch('http://localhost:3000/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Failed to refresh token');
          }

          const data = await response.json();
          this.storeTokens(data.accessToken, data.refreshToken || refreshToken);
          return data.accessToken;
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
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
      }
    };

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
          <strong>Access Token:</strong> ${TokenManager.getTokens().accessToken.substring(0, 20)}...
          <br><strong>Refresh Token:</strong> ${TokenManager.getTokens().refreshToken.substring(0, 20)}...
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

    document.getElementById('login-form').addEventListener('submit', async function (e) {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const resultDiv = document.getElementById('result');
      const loadingDiv = document.getElementById('loading');
      const submitBtn = document.querySelector('.submit-btn');

      // Show loading
      loadingDiv.style.display = 'block';
      submitBtn.disabled = true;
      resultDiv.classList.add('hidden');

      try {
        const response = await fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        // Hide loading
        loadingDiv.style.display = 'none';
        submitBtn.disabled = false;

        if (response.ok) {
          // Store tokens
          TokenManager.storeTokens(data.accessToken, data.refreshToken);
          
          resultDiv.textContent = 'Successfully logged in! ' + data.message;
          resultDiv.className = 'result success';
          
          // Show token info
          setTimeout(() => {
            resultDiv.innerHTML = `
              <strong>Login Successful!</strong><br>
              Access Token: ${data.accessToken.substring(0, 20)}...<br>
              Refresh Token: ${data.refreshToken.substring(0, 20)}...<br>
              <button class="submit-btn" onclick="logout()" style="margin-top: 10px; background: #dc3545;">Logout</button>
            `;
          }, 1000);

          console.log('Access Token:', data.accessToken);
          console.log('Refresh Token:', data.refreshToken);
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

    // Example of making authenticated requests
    async function makeAuthenticatedRequest() {
      try {
        const response = await TokenManager.authenticatedRequest('http://localhost:3000/protected-route');
        const data = await response.json();
        console.log('Protected data:', data);
      } catch (error) {
        console.error('Authentication error:', error);
      }
    }

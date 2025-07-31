const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User');
const config = require('../config/environment');

function generateToken(payload, expiresIn) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}

class AuthController {
  // Đăng ký
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      console.log(`🔍 Register attempt - Username: "${username}", Email: "${email}"`);
      
      // Check existing user (SQLite syntax)
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: email },
            { username: username }
          ]
        }
      });
      
      if (existingUser) {
        console.log(`❌ User already exists - ID: ${existingUser.id}, Username: "${existingUser.username}", Email: "${existingUser.email}"`);
        return res.status(409).json({ message: 'Username or email already exists' });
      }
      
      console.log(`✅ No existing user found, creating new user...`);
      
      const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
      const user = await User.create({ username, email, passwordHash });
      
      console.log(`✅ User created successfully - ID: ${user.id}, Username: "${user.username}", Email: "${user.email}"`);
      res.status(201).json({ message: 'User registered successfully', user: { username, email } });
    } catch (err) {
      console.error(`❌ Registration error:`, err);
      res.status(500).json({ message: 'Registration failed', error: err.message });
    }
  }

  // Đăng nhập
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Missing email or password' });
      }
      
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const accessToken = generateToken({ userId: user.id }, config.jwtExpiresIn);
      const refreshToken = generateToken({ userId: user.id }, config.refreshTokenExpiresIn);
      
      // Log tokens for development (optional) - Comment out if not needed
      // console.log('🔑 Access Token:', accessToken);
      // console.log('🔄 Refresh Token:', refreshToken);
      
      res.json({ 
        message: 'Login successful', 
        data: { 
          accessToken, 
          refreshToken, 
          user: { username: user.username, email: user.email } 
        } 
      });
    } catch (err) {
      res.status(500).json({ message: 'Login failed', error: err.message });
    }
  }

  // Quên mật khẩu (gửi mã reset)
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Email is required' });
      
      console.log(`🔍 Looking for user with email: ${email}`);
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        console.log(`❌ User not found: ${email}`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log(`✅ User found: ${user.email}`);

      // Tạo mã reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 15); // 15 phút

      console.log(`🔑 Generated reset token: ${resetToken}`);

      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await user.save();

      console.log(`💾 Saved reset token to database`);

      // Log reset token cho development
      console.log(`🔑 Reset token for ${email}: ${resetToken}`);
      console.log(`📧 Reset link: http://localhost:3000/reset-password?token=${resetToken}&email=${email}`);

      const response = { 
        message: 'Reset password link sent to email (check console in dev)',
        token: resetToken // Trả về token cho development
      };
      
      console.log(`📤 Sending response:`, response);
      res.json(response);
    } catch (err) {
      console.error(`❌ Forgot password error:`, err);
      res.status(500).json({ message: 'Forgot password failed', error: err.message });
    }
  }

  // Đặt lại mật khẩu
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const user = await User.findOne({ 
        where: { 
          resetToken: token,
          resetTokenExpiry: {
            [Op.gt]: new Date()
          }
        }
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      
      user.passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
      
      res.json({ message: 'Password reset successful' });
    } catch (err) {
      res.status(500).json({ message: 'Reset password failed', error: err.message });
    }
  }
}

module.exports = AuthController; 
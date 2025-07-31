//API endpoints và logic server (chạy ở node.js server)
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Đăng ký, đăng nhập, quên mật khẩu, đặt lại mật khẩu
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected example
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'You are authorized!', user: req.user });
});

module.exports = router;

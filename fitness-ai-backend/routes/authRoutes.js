const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authCtrl');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.get('/me', verifyToken, authCtrl.getMe);

// OAuth Google & Phone OTP Routes
router.post('/google', authCtrl.googleAuth);
router.post('/phone/send-otp', authCtrl.sendPhoneOtp);
router.post('/phone/verify-otp', authCtrl.verifyPhoneOtp);

module.exports = router;
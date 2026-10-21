// routes/packageRoutes.js
const express = require('express');
const router = express.Router();
const packageCtrl = require('../controllers/packageCtrl');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

// 1. Lấy danh sách gói tập (public)
router.get('/', packageCtrl.getPackages);

// 2. Mua gói tập & Auto-assign PT
router.post('/purchase', optionalAuth, packageCtrl.purchasePackage);

// 3. Khảo sát trải nghiệm sau khi hết buổi
router.post('/review', optionalAuth, packageCtrl.submitExperienceReview);

// 4. Lấy gói tập hiện tại của người dùng
router.get('/my-package', optionalAuth, packageCtrl.getMyCurrentPackage);

module.exports = router;

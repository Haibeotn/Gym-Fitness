// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', message: 'Vui lòng đăng nhập để tiếp tục.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fitness_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ status: 'error', message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.' });
    }
};

const requireRole = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ status: 'error', message: 'Không có quyền truy cập.' });
        }

        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (!rolesArray.includes(req.user.role)) {
            return res.status(403).json({ 
                status: 'error', 
                message: `Quyền truy cập bị từ chối. Cần vai trò: ${rolesArray.join(', ')}.` 
            });
        }
        next();
    };
};

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fitness_secret_key');
            req.user = decoded;
        } catch (err) {
            // Token invalid or expired, continue as guest
            req.user = null;
        }
    }
    next();
};

module.exports = { verifyToken, requireRole, optionalAuth };

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const db_1 = require("../utils/db");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = (0, db_1.get)('SELECT id, email FROM users WHERE id = ? LIMIT 1', [decoded.userId]);
        if (!user) {
            logger_1.logger.error('User not found for token');
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: decoded.role || 'user'
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Token verification failed:', error);
        res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
        return;
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map
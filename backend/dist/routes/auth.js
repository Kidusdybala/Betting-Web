"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../utils/db");
const validation_1 = require("../middleware/validation");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
router.post('/register', validation_1.registerValidation, async (req, res, next) => {
    try {
        const { email, password, fullName } = req.body;
        const existing = (0, db_1.get)('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
        if (existing) {
            return next((0, errorHandler_1.createError)('User already exists with this email', 400));
        }
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const id = (0, db_1.generateId)();
        const now = (0, db_1.nowIso)();
        (0, db_1.run)(`INSERT INTO users (id, email, full_name, password_hash, balance, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`, [id, email, fullName || null, hashedPassword, now, now]);
        const token = jsonwebtoken_1.default.sign({ userId: id, email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        logger_1.logger.info(`New user registered: ${email}`);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id,
                    email,
                    fullName: fullName || null,
                    balance: 0
                },
                token
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        next((0, errorHandler_1.createError)('Registration failed', 500));
    }
});
router.post('/login', validation_1.loginValidation, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = (0, db_1.get)('SELECT id, email, full_name, balance, password_hash FROM users WHERE email = ? LIMIT 1', [email]);
        if (!user) {
            return next((0, errorHandler_1.createError)('Invalid email or password', 401));
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return next((0, errorHandler_1.createError)('Invalid email or password', 401));
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        logger_1.logger.info(`User logged in: ${email}`);
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    balance: user.balance
                },
                token
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        next((0, errorHandler_1.createError)('Login failed', 500));
    }
});
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return next((0, errorHandler_1.createError)('Refresh token required', 401));
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET);
        const user = (0, db_1.get)('SELECT id, email, full_name, balance FROM users WHERE id = ? LIMIT 1', [decoded.userId]);
        if (!user) {
            return next((0, errorHandler_1.createError)('Invalid refresh token', 401));
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    balance: user.balance
                },
                token
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Token refresh error:', error);
        next((0, errorHandler_1.createError)('Token refresh failed', 401));
    }
});
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map
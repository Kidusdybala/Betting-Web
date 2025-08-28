import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get, nowIso, generateId } from '../utils/db';
import { registerValidation, loginValidation } from '../middleware/validation';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Register new user
router.post('/register', registerValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName } = req.body as { email: string; password: string; fullName?: string };

    // Check if user already exists
    const existing = get<{ id: string }>('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing) {
      return next(createError('User already exists with this email', 400));
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const id = generateId();
    const now = nowIso();

    // Create user
    run(
      `INSERT INTO users (id, email, full_name, password_hash, balance, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [id, email, fullName || null, hashedPassword, now, now]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: id, email, role: 'user' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    logger.info(`New user registered: ${email}`);

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
  } catch (error) {
    logger.error('Registration error:', error);
    next(createError('Registration failed', 500));
  }
});

// Login user
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = get<{ id: string; email: string; full_name: string; balance: number; password_hash: string }>(
      'SELECT id, email, full_name, balance, password_hash FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!user) {
      return next(createError('Invalid email or password', 401));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return next(createError('Invalid email or password', 401));
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'user' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    logger.info(`User logged in: ${email}`);

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
  } catch (error) {
    logger.error('Login error:', error);
    next(createError('Login failed', 500));
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return next(createError('Refresh token required', 401));
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;

    const user = get<{ id: string; email: string; full_name: string; balance: number }>(
      'SELECT id, email, full_name, balance FROM users WHERE id = ? LIMIT 1',
      [decoded.userId]
    );

    if (!user) {
      return next(createError('Invalid refresh token', 401));
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'user' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

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
  } catch (error) {
    logger.error('Token refresh error:', error);
    next(createError('Token refresh failed', 401));
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

// Auth validation rules
export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  handleValidationErrors
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Bet validation rules
export const placeBetValidation = [
  body('matchId')
    .isUUID()
    .withMessage('Valid match ID is required'),
  body('betType')
    .isIn(['home', 'draw', 'away'])
    .withMessage('Bet type must be home, draw, or away'),
  body('stake')
    .isFloat({ min: 1, max: 10000 })
    .withMessage('Stake must be between 1 and 10,000'),
  body('odds')
    .isFloat({ min: 1.01 })
    .withMessage('Odds must be at least 1.01'),
  handleValidationErrors
];

// Match validation rules
export const createMatchValidation = [
  body('homeTeam')
    .isLength({ min: 2, max: 50 })
    .withMessage('Home team name must be between 2 and 50 characters'),
  body('awayTeam')
    .isLength({ min: 2, max: 50 })
    .withMessage('Away team name must be between 2 and 50 characters'),
  body('league')
    .isLength({ min: 2, max: 50 })
    .withMessage('League name must be between 2 and 50 characters'),
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),
  handleValidationErrors
];

// Odds validation rules
export const updateOddsValidation = [
  param('matchId')
    .isUUID()
    .withMessage('Valid match ID is required'),
  body('homeOdds')
    .isFloat({ min: 1.01 })
    .withMessage('Home odds must be at least 1.01'),
  body('drawOdds')
    .isFloat({ min: 1.01 })
    .withMessage('Draw odds must be at least 1.01'),
  body('awayOdds')
    .isFloat({ min: 1.01 })
    .withMessage('Away odds must be at least 1.01'),
  handleValidationErrors
];

// Payment validation rules
export const depositValidation = [
  body('amount')
    .isFloat({ min: 10, max: 50000 })
    .withMessage('Deposit amount must be between 10 and 50,000'),
  body('paymentMethod')
    .isIn(['card', 'bank_transfer', 'mobile_money'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
];

export const withdrawalValidation = [
  body('amount')
    .isFloat({ min: 50, max: 50000 })
    .withMessage('Withdrawal amount must be between 50 and 50,000'),
  body('paymentMethod')
    .isIn(['bank_transfer', 'mobile_money'])
    .withMessage('Invalid payment method'),
  body('accountDetails')
    .notEmpty()
    .withMessage('Account details are required'),
  handleValidationErrors
];

// Query validation rules
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];
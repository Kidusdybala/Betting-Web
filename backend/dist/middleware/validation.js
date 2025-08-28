"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationValidation = exports.withdrawalValidation = exports.depositValidation = exports.updateOddsValidation = exports.createMatchValidation = exports.placeBetValidation = exports.loginValidation = exports.registerValidation = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
exports.handleValidationErrors = handleValidationErrors;
exports.registerValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('fullName')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Full name must be between 2 and 50 characters'),
    exports.handleValidationErrors
];
exports.loginValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
    exports.handleValidationErrors
];
exports.placeBetValidation = [
    (0, express_validator_1.body)('matchId')
        .isUUID()
        .withMessage('Valid match ID is required'),
    (0, express_validator_1.body)('betType')
        .isIn(['home', 'draw', 'away'])
        .withMessage('Bet type must be home, draw, or away'),
    (0, express_validator_1.body)('stake')
        .isFloat({ min: 1, max: 10000 })
        .withMessage('Stake must be between 1 and 10,000'),
    (0, express_validator_1.body)('odds')
        .isFloat({ min: 1.01 })
        .withMessage('Odds must be at least 1.01'),
    exports.handleValidationErrors
];
exports.createMatchValidation = [
    (0, express_validator_1.body)('homeTeam')
        .isLength({ min: 2, max: 50 })
        .withMessage('Home team name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('awayTeam')
        .isLength({ min: 2, max: 50 })
        .withMessage('Away team name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('league')
        .isLength({ min: 2, max: 50 })
        .withMessage('League name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('startTime')
        .isISO8601()
        .withMessage('Start time must be a valid ISO 8601 date'),
    exports.handleValidationErrors
];
exports.updateOddsValidation = [
    (0, express_validator_1.param)('matchId')
        .isUUID()
        .withMessage('Valid match ID is required'),
    (0, express_validator_1.body)('homeOdds')
        .isFloat({ min: 1.01 })
        .withMessage('Home odds must be at least 1.01'),
    (0, express_validator_1.body)('drawOdds')
        .isFloat({ min: 1.01 })
        .withMessage('Draw odds must be at least 1.01'),
    (0, express_validator_1.body)('awayOdds')
        .isFloat({ min: 1.01 })
        .withMessage('Away odds must be at least 1.01'),
    exports.handleValidationErrors
];
exports.depositValidation = [
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 10, max: 50000 })
        .withMessage('Deposit amount must be between 10 and 50,000'),
    (0, express_validator_1.body)('paymentMethod')
        .isIn(['card', 'bank_transfer', 'mobile_money'])
        .withMessage('Invalid payment method'),
    exports.handleValidationErrors
];
exports.withdrawalValidation = [
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 50, max: 50000 })
        .withMessage('Withdrawal amount must be between 50 and 50,000'),
    (0, express_validator_1.body)('paymentMethod')
        .isIn(['bank_transfer', 'mobile_money'])
        .withMessage('Invalid payment method'),
    (0, express_validator_1.body)('accountDetails')
        .notEmpty()
        .withMessage('Account details are required'),
    exports.handleValidationErrors
];
exports.paginationValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    exports.handleValidationErrors
];
//# sourceMappingURL=validation.js.map
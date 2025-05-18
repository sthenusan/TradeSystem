const { AppError } = require('../utils/errors');

// Development error response
const sendErrorDev = (err, req, res) => {
    // API error
    if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    // Rendered website error
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).render('error', {
        title: 'Error',
        msg: err.message,
        error: err,
        stack: err.stack
    });
};

// Production error response
const sendErrorProd = (err, req, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        // API error
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }

        // Rendered website error
        return res.status(err.statusCode).render('error', {
            title: 'Error',
            msg: err.message,
            error: {}
        });
    }

    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);

    // API error
    if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        });
    }

    // Rendered website error
    return res.status(500).render('error', {
        title: 'Error',
        msg: 'Something went wrong!',
        error: {}
    });
};

// Handle Mongoose validation errors
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

// Handle Mongoose duplicate field errors
const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

// Handle Mongoose CastError
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

// Main error handling middleware
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
}; 
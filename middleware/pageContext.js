// Middleware to set page context variables
module.exports = (req, res, next) => {
    // Set user from passport session
    res.locals.user = req.user || null;
    
    // Set current page based on URL
    const path = req.path;
    res.locals.currentPage = path.split('/')[1] || '';
    
    next();
}; 
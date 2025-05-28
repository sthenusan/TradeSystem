module.exports = {
    testEnvironment: 'node',
    setupFiles: ['dotenv/config'],
    testMatch: ['**/tests/**/*.test.js'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    testTimeout: 10000
}; 
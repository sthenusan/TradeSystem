module.exports = {
    testEnvironment: 'node',
<<<<<<< HEAD
    moduleDirectories: ['node_modules', 'src'],
    moduleFileExtensions: ['js', 'json'],
    rootDir: '.',
    testMatch: ['**/tests/**/*.test.js'],
    setupFiles: ['<rootDir>/tests/setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    }
=======
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: [
        '**/tests/**/*.test.js',
        '!**/tests/e2e/**',
        '!**/cypress/**'
    ],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
>>>>>>> fix/trade-issues
}; 
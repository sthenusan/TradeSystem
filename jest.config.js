module.exports = {
    testEnvironment: 'node',
    moduleDirectories: ['node_modules', 'src'],
    moduleFileExtensions: ['js', 'json'],
    rootDir: '.',
    testMatch: ['**/tests/**/*.test.js'],
    setupFiles: ['<rootDir>/tests/setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    }
}; 
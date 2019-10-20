module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    moduleFileExtensions: [
        'ts',
        'js'
    ],
    testMatch: [
        '**/spec/**/*.spec.(js|ts)|**/__tests__/*.(js|ts)'
    ],
    transformIgnorePatterns: [
        '/node_modules/'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    }
};

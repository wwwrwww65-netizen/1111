"use strict";
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/app';
}
if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
}
// Force NODE_ENV=test for predictable server behavior in tests
process.env.NODE_ENV = 'test';
// Repair any stray test DB URL overrides from previous builds
if (process.env.DATABASE_URL && /postgresql:\/\/test:test@localhost/.test(process.env.DATABASE_URL)) {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/app';
    process.env.DIRECT_URL = process.env.DATABASE_URL;
}
// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
//# sourceMappingURL=setupTests.js.map
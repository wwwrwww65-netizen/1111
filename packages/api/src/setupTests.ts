process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/app';
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
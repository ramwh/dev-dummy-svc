// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Mock logger to prevent console output during tests
  jest.mock('@/utils/logger', () => ({
    loggers: {
      app: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
      db: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
      redis: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
      http: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
      auth: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
      user: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
    },
    logStartup: jest.fn(),
    logDbOperation: jest.fn(),
    logRedisOperation: jest.fn(),
    createLogger: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
  }));
});

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});

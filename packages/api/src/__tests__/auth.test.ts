import { createTRPCMsw } from 'msw-trpc';
import { appRouter } from '../router';
import { createContext } from '../trpc';

const t = createTRPCMsw(appRouter);

describe('Auth Router', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER' as const,
    isVerified: false,
  };

  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    // Reset any mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const input = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      // Mock the database calls
      const mockDb = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockUser),
        },
        cart: {
          create: jest.fn().mockResolvedValue({ id: 'cart-1' }),
        },
      };

      // Create a test context
      const ctx = await createContext({ req: {} as any, res: {} as any });

      // Call the register procedure
      const result = await appRouter.createCaller(ctx).auth.register(input);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      // Mock the database to return existing user
      const mockDb = {
        user: {
          findUnique: jest.fn().mockResolvedValue(mockUser),
        },
      };

      const ctx = await createContext({ req: {} as any, res: {} as any });

      await expect(
        appRouter.createCaller(ctx).auth.register(input)
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUserWithPassword = {
        ...mockUser,
        password: '$2a$12$hashedpassword', // Mocked hashed password
      };

      // Mock bcrypt to return true for password comparison
      jest.mock('bcryptjs', () => ({
        compare: jest.fn().mockResolvedValue(true),
      }));

      const ctx = await createContext({ req: {} as any, res: {} as any });

      const result = await appRouter.createCaller(ctx).auth.login(input);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBeDefined();
    });

    it('should throw error with invalid credentials', async () => {
      const input = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const ctx = await createContext({ req: {} as any, res: {} as any });

      await expect(
        appRouter.createCaller(ctx).auth.login(input)
      ).rejects.toThrow('Invalid email or password');
    });
  });
});
import { UserService } from '../services/UserService';
import { UserModel } from '../models/User';
import { UnauthorizedError } from '../utils/error';

describe('User Auth Service', () => {
  const sampleUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'secure123',
    role: 'user'
  };

  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  it('should sign up a user and return token + user', async () => {
    const result = await UserService.signup(sampleUser as any);
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe(sampleUser.email);
  });

  it('should not allow duplicate signup', async () => {
    await UserService.signup(sampleUser as any);

    await expect(UserService.signup(sampleUser as any))
      .rejects
      .toThrow('Email already registered');
  });

  it('should login with valid credentials', async () => {
    await UserService.signup(sampleUser as any);
    const result = await UserService.login(sampleUser.email, sampleUser.password);
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe(sampleUser.email);
  });

  it('should throw for invalid login', async () => {
    await expect(UserService.login('wrong@example.com', 'wrongpass'))
      .rejects
      .toThrow(UnauthorizedError);
  });

  it('should get current user by ID', async () => {
    const { user } = await UserService.signup(sampleUser as any);
    const foundUser = await UserService.getMe(user.id);
    expect(foundUser?.email).toBe(sampleUser.email);
  });
});

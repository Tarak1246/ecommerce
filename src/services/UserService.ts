import { UserModel, IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { BadRequestError, UnauthorizedError } from '../utils/error';
import { logger } from '../utils/logger';

export class UserService {
  static async signup(data: IUser): Promise<{ token: string, user: IUser }> {
    const exists = await UserModel.findOne({ email: data.email });
    if (exists){
      logger.warn(`Signup failed: email already exists - ${data.email}`);
      throw new BadRequestError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = new UserModel({ ...data, password: hashedPassword });
    await newUser.save();
    logger.info(`New user signed up: ${newUser.email}`);
    const token = generateToken(newUser);
    return { token, user: newUser };
  }

  static async login(email: string, password: string): Promise<{ token: string, user: IUser }> {
    const user = await UserModel.findOne({ email });
    if (!user) {
      logger.warn(`Login failed: user not found - ${email}`);
      throw new UnauthorizedError('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logger.warn(`Login failed: password mismatch for - ${email}`);
      throw new UnauthorizedError('Invalid credentials');
    }
    logger.info(`User logged in: ${email}`);
    const token = generateToken(user);
    return { token, user };
  }

  static async getMe(userId: string): Promise<IUser | null> {
    return await UserModel.findById(userId);
  }
}

import { UserService } from '../../services/UserService';
import { signupSchema, loginSchema } from '../../validators/user';
import { IUser } from '../../models/User';
import { IContext } from '../../types/context';

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, context: IContext): Promise<IUser | null> => {
      if (!context.user) throw new Error('Not authenticated');
      return await UserService.getMe(context.user.id);
    }
  },
  Mutation: {
    signup: async (_: any, { userInput }: any): Promise<any> => {
      const { error } = signupSchema.validate(userInput);
      if (error) throw new Error(error.details[0].message);
      return await UserService.signup(userInput);
    },
    login: async (_: any, { credentials }: any): Promise<any> => {
      const { error } = loginSchema.validate(credentials);
      if (error) throw new Error(error.details[0].message);
      return await UserService.login(credentials.email, credentials.password);
    }
  }
};

export interface IContext {
    user: {
      id: string;
      email: string;
      role: 'user' | 'admin';
    } | null;
  }
  
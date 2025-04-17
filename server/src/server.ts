import { ApolloServer, ApolloError } from 'apollo-server';
import { config } from 'dotenv';
import { connectDB } from './config/db';
import { userTypeDefs } from './graphql/schema/user';
import { userResolvers } from './graphql/resolvers/user';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { verifyToken } from './utils/jwt';
import { IContext } from './types/context';
import { logger } from './utils/logger';
import { AppError } from './utils/error';
config();
connectDB();

const schema = makeExecutableSchema({
  typeDefs: [userTypeDefs],
  resolvers: [userResolvers]
});

const server = new ApolloServer({
  schema,
  context: ({ req }): IContext => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return { user: null };

    try {
      const user = verifyToken(token);
      return { user };
    } catch {
      return { user: null };
    }
  },
  formatError: (err) => {
    const error = err.originalError;

    // Log everything
    logger.error(err);

    if (error instanceof AppError) {
      return {
        message: error.message,
        statusCode: error.statusCode,
        isOperational: error.isOperational
      };
    }

    return new ApolloError('Internal server error', 'INTERNAL_SERVER_ERROR');
  }
});

server.listen({ port: process.env.PORT }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

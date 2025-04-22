import { makeExecutableSchema } from '@graphql-tools/schema';
import { userTypeDefs } from './schema/user';
import { userResolvers } from './resolvers/user';
import { productTypeDefs } from './schema/product';
import { productResolvers } from './resolvers/product';

export const schema = makeExecutableSchema({
  typeDefs: [userTypeDefs, productTypeDefs],
  resolvers: [userResolvers, productResolvers]
});

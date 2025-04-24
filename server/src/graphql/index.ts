import { makeExecutableSchema } from '@graphql-tools/schema';
import { userTypeDefs } from './schema/user';
import { userResolvers } from './resolvers/user';
import { productTypeDefs } from './schema/product';
import { productResolvers } from './resolvers/product';
import { cartTypeDefs } from './schema/cart';
import { cartResolvers } from './resolvers/cart';

export const schema = makeExecutableSchema({
  typeDefs: [userTypeDefs, productTypeDefs, cartTypeDefs],
  resolvers: [userResolvers, productResolvers, cartResolvers]
});

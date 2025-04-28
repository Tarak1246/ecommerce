import { makeExecutableSchema } from '@graphql-tools/schema';
import { userTypeDefs } from './schema/user';
import { userResolvers } from './resolvers/user';
import { productTypeDefs } from './schema/product';
import { productResolvers } from './resolvers/product';
import { cartTypeDefs } from './schema/cart';
import { cartResolvers } from './resolvers/cart';
import { orderTypeDefs } from './schema/order';
import { orderResolvers } from './resolvers/order';
import {  reviewTypeDefs } from './schema/review';
import { reviewResolvers } from './resolvers/review';

export const schema = makeExecutableSchema({
  typeDefs: [userTypeDefs, productTypeDefs, cartTypeDefs, orderTypeDefs, reviewTypeDefs],
  resolvers: [userResolvers, productResolvers, cartResolvers, orderResolvers, reviewResolvers],
});

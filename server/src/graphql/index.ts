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
import { categoryTypeDefs } from './schema/category';
import { categoryResolvers } from './resolvers/category';

export const schema = makeExecutableSchema({
  typeDefs: [userTypeDefs, productTypeDefs, cartTypeDefs, orderTypeDefs, reviewTypeDefs, categoryTypeDefs],
  resolvers: [userResolvers, productResolvers, cartResolvers, orderResolvers, reviewResolvers, categoryResolvers],
});

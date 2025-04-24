import { gql } from 'apollo-server';

export const cartTypeDefs = gql`
  type CartItem {
    productId: ID!
    quantity: Int!
  }

  type Cart {
    id: ID!
    userId: ID!
    items: [CartItem!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getCart: Cart!
  }

  type Mutation {
    addToCart(productId: ID!): Cart
    updateCartItem(productId: ID!, quantity: Int!): Cart
    removeFromCart(productId: ID!): Cart
    clearCart: Boolean
  }
`;
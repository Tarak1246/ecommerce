// graphql/schema/review.ts
import { gql } from 'apollo-server';

export const reviewTypeDefs = gql`
  type Review {
    id: ID!
    productId: ID!
    userId: ID!
    rating: Int!
    comment: String
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getProductReviews(productId: ID!): [Review!]!
  }

  type Mutation {
    addReview(productId: ID!, rating: Int!, comment: String): Review
    updateReview(id: ID!, rating: Int, comment: String): Review
    deleteReview(id: ID!): Boolean
  }
`;

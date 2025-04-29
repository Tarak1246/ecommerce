import { gql } from 'apollo-server';

export const categoryTypeDefs = gql`
  type Category {
    id: ID!
    name: String!
    slug: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getCategories: [Category!]!
  }

  type Mutation {
    createCategory(name: String!): Category!
    updateCategory(id: ID!, name: String!): Category!
    deleteCategory(id: ID!): Boolean!
  }
`;

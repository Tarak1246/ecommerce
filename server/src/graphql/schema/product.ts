import { gql } from 'apollo-server';

export const productTypeDefs = gql`
  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String!
    price: Float!
    stock: Int!
    category: String!
    images: [String]
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  input ProductInput {
    name: String!
    description: String!
    price: Float!
    stock: Int!
    category: String!
    images: [String]
  }

  input ProductUpdateInput {
    name: String
    description: String
    price: Float
    stock: Int
    category: String
    images: [String]
  }

  input ProductFilter {
    search: String
    category: String
    minPrice: Float
    maxPrice: Float
    sortBy: String
    limit: Int = 10
    offset: Int = 0
  }

  extend type Query {
    getProduct(slug: String!): Product
    getProducts(filter: ProductFilter): [Product]
  }

  extend type Mutation {
    createProduct(input: ProductInput!): Product
    updateProduct(id: ID!, input: ProductUpdateInput!): Product
    deleteProduct(id: ID!): Boolean
  }
`;

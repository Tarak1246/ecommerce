import { gql } from 'apollo-server';

export const productTypeDefs = gql`
  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String!
    price: Float!
    stock: Int!
    category: Category!
    averageRating: Float
    images: [String]
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  input ProductInput {
    name: String!
    description: String
    price: Float!
    stock: Int!
    images: [String!]
    category: ID!
  }

  input ProductUpdateInput {
    name: String
    description: String
    price: Float
    stock: Int
    category: ID
    images: [String!]
  }

  input ProductFilter {
    search: String
    category: ID
    minPrice: Float
    maxPrice: Float
    sortBy: String
    limit: Int = 10
    offset: Int = 0
  }

  type Query {
    getProduct(slug: String!): Product
    getProducts(filter: ProductFilter): [Product!]
  }

  type Mutation {
    createProduct(input: ProductInput!): Product
    updateProduct(id: ID!, input: ProductUpdateInput!): Product
    deleteProduct(id: ID!): Boolean
  }
`;

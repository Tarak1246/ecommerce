import { gql } from 'apollo-server';

export const orderTypeDefs = gql`
  type OrderItem {
    productId: ID!
    name: String!
    price: Float!
    quantity: Int!
  }

  type Payment {
    method: String!
    status: String!
    transactionId: String
  }

  type Shipping {
    address: String!
    city: String!
    zip: String!
    country: String!
  }

  type Order {
    id: ID!
    userId: ID!
    items: [OrderItem!]!
    total: Float!
    status: String!
    payment: Payment!
    shipping: Shipping!
    placedAt: String!
    updatedAt: String!
  }

  input ShippingInput {
    address: String!
    city: String!
    zip: String!
    country: String!
  }

  input PlaceOrderInput {
    itemProductIds: [ID!]
    paymentMethod: String!
    shipping: ShippingInput!
  }

  type Query {
    getOrders: [Order!]!
    getOrder(id: ID!): Order
  }

  type Mutation {
    placeOrder(input: PlaceOrderInput!): Order
    updateOrderStatus(id: ID!, status: String!): Order
    cancelOrder(id: ID!): Boolean
  }
`;

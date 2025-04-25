import { ApolloServer } from 'apollo-server';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { schema } from '../graphql';
import { ProductModel } from '../models/Product';
import { CartModel } from '../models/Cart';
import { OrderModel } from '../models/Order';

let server: ApolloServer;
let mongo: MongoMemoryServer;
const testUserId = new Types.ObjectId();
let productId: string;
let placedOrderId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();

  server = new ApolloServer({
    schema,
    context: () => ({
      user: {
        id: testUserId.toHexString(),
        email: 'user@example.com',
        role: 'user'
      }
    })
  });
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    if (mongo) await mongo.stop();
});

afterEach(async () => {
  await OrderModel.deleteMany();
  await CartModel.deleteMany();
  await ProductModel.deleteMany();
});

describe('GraphQL Order Integration Tests', () => {
    beforeEach(async () => {
        await ProductModel.deleteMany({});
        await CartModel.deleteMany({});
        await OrderModel.deleteMany({});
      
        const product = await ProductModel.create({
          name: 'GraphQL Product',
          description: 'Testing order flow',
          price: 100,
          stock: 50,
          category: 'Test'
        });
      
        productId = product.id;
      
        // Add to cart
        await server.executeOperation({
          query: `mutation { addToCart(productId: "${productId}") { id } }`
        });
      
        // Place Order
        const place = await server.executeOperation({
          query: `
            mutation {
              placeOrder(input: {
                paymentMethod: "cod",
                shipping: {
                  address: "123 Main St",
                  city: "Testville",
                  zip: "00000",
                  country: "Nowhere"
                }
              }) {
                id
                total
                items { productId quantity }
              }
            }
          `
        });
      
        placedOrderId = place.data?.placeOrder?.id;
        console.log('Placed Order ID:', placedOrderId);
      });
      

  it('should place an order', async () => {
     // Add to cart
     await server.executeOperation({
        query: `mutation { addToCart(productId: "${productId}") { id } }`
      });
    
    const result = await server.executeOperation({
      query: `
        mutation {
          placeOrder(input: {
            paymentMethod: "cod",
            shipping: {
              address: "123 Main",
              city: "Town",
              zip: "00001",
              country: "Nowhere"
            }
          }) {
            id
            total
            items { productId quantity }
          }
        }
      `
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.placeOrder.total).toBeGreaterThan(0);
    console.log('Placed Order:', result.data?.placeOrder);
    placedOrderId = result.data?.placeOrder.id;
  });

  it('should return user order history', async () => {
    await server.executeOperation({ query: `mutation { addToCart(productId: "${productId}") { id } }` });
    const place = await server.executeOperation({
      query: `
        mutation {
          placeOrder(input: {
            paymentMethod: "cod",
            shipping: {
              address: "456 Lane",
              city: "City",
              zip: "12345",
              country: "Somewhere"
            }
          }) { id }
        }`
    });
    console.log('Placed Order:', place.data?.placeOrder);
    placedOrderId = place.data?.placeOrder.id;

    const result = await server.executeOperation({ query: `query { getOrders { id } }` });
    expect(result.errors).toBeUndefined();
    expect(result.data?.getOrders.length).toBeGreaterThan(0);
  });

  it('should return specific order details by ID', async () => {
    const result = await server.executeOperation({
      query: `query { getOrder(id: "${placedOrderId}") { id total items { productId quantity } } }`
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.getOrder.id).toBe(placedOrderId);
  });

  it('should cancel the order', async () => {
    const result = await server.executeOperation({
      query: `mutation { cancelOrder(id: "${placedOrderId}") }`
    });
    expect(result.errors).toBeUndefined();
    expect(result.data?.cancelOrder).toBe(true);
  });

  it('should not allow cancelling shipped order', async () => {
    await OrderModel.findByIdAndUpdate(placedOrderId, { status: 'shipped' });

    const result = await server.executeOperation({
      query: `mutation { cancelOrder(id: "${placedOrderId}") }`
    });
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0].message).toMatch(/already shipped or delivered/);
  });

  it('should not place order when cart is empty', async () => {
    await CartModel.updateOne({ userId: testUserId }, { items: [] });

    const result = await server.executeOperation({
      query: `
        mutation {
          placeOrder(input: {
            paymentMethod: "cod",
            shipping: {
              address: "Empty Cart",
              city: "None",
              zip: "00000",
              country: "Void"
            }
          }) { id }
        }
      `
    });
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0].message).toMatch(/Cart is empty/);
  });
});

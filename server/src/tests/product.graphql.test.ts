import { ApolloServer } from 'apollo-server';
import { schema } from '../graphql';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ProductModel } from '../models/Product';

const testUserId = new Types.ObjectId();
let server: ApolloServer;
let mongo: MongoMemoryServer;

jest.setTimeout(20000);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();

  server = new ApolloServer({
    schema,
    context: () => ({
      user: {
        id: testUserId.toHexString(),
        email: 'admin@example.com',
        role: 'admin'
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
  await ProductModel.deleteMany({});
});

describe('GraphQL Product Integration Tests', () => {
  let createdId: string;

  it('should create a new product', async () => {
    const result = await server.executeOperation({
      query: `
        mutation {
          createProduct(input: {
            name: "GraphQL Product",
            description: "Test product from integration test",
            price: 199.99,
            stock: 30,
            category: "64bde2f09b3efb0022d1f999",
            images: ["https://example.com/test.png"]
          }) {
            id
            name
            slug
          }
        }
      `
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.createProduct.name).toBe('GraphQL Product');
    createdId = result.data?.createProduct.id;
  });

  it('should fetch a product by slug', async () => {
    const product = new ProductModel({
      name: 'Fetchable Product',
      slug: 'fetchable-product',
      description: 'Another product',
      price: 99.99,
      stock: 10,
      category: new Types.ObjectId(),
      isActive: true
    });
    await product.save();

    const result = await server.executeOperation({
      query: `
        query {
          getProduct(slug: "fetchable-product") {
            id
            name
            price
          }
        }
      `
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.getProduct.name).toBe('Fetchable Product');
  });

  it('should reject createProduct if user is not admin', async () => {
    const nonAdminServer = new ApolloServer({
      schema,
      context: () => ({
        user: { id: 'u1', email: 'user@example.com', role: 'user' }
      })
    });

    const result = await nonAdminServer.executeOperation({
      query: `
        mutation {
          createProduct(input: {
            name: "Not Allowed",
            description: "Should fail",
            price: 10.99,
            stock: 5,
            category: "64bde2f09b3efb0022d1f999"
          }) {
            id
          }
        }
      `
    });

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0].message).toBe('Only admins can create products');
  });

  it('should return error for invalid input', async () => {
    const result = await server.executeOperation({
      query: `
        mutation {
          createProduct(input: {
            name: "",
            description: "",
            price: -10,
            stock: -5,
            category: ""
          }) {
            id
          }
        }
      `
    });

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0].message).toMatch(/allowed to be empty/i);
  });

  describe('Product update and delete tests', () => {
    let productId: string;

    beforeEach(async () => {
      const product = new ProductModel({
        name: 'Product to Edit',
        slug: 'product-to-edit',
        description: 'For update and delete testing',
        price: 59.99,
        stock: 10,
        category: new Types.ObjectId(),
        isActive: true
      });
      await product.save();
      productId = product._id?.toString() || '';
    });

    it('should update a product and deactivate if stock is 0', async () => {
      const result = await server.executeOperation({
        query: `
          mutation {
            updateProduct(id: "${productId}", input: {
              stock: 0
            }) {
              id
              stock
              isActive
            }
          }
        `
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.updateProduct.stock).toBe(0);
      expect(result.data?.updateProduct.isActive).toBe(false);
    });

    it('should delete a product', async () => {
      const result = await server.executeOperation({
        query: `
          mutation {
            deleteProduct(id: "${productId}")
          }
        `
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.deleteProduct).toBe(true);

      const deletedProduct = await ProductModel.findById(productId);
      expect(deletedProduct?.isActive).toBe(false);
    });

    it('should return error for invalid product ID', async () => {
      const result = await server.executeOperation({
        query: `
          mutation {
            updateProduct(id: "123", input: { stock: 10 }) {
              id
              stock
            }
          }
        `
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toMatch(/Invalid product ID/i);
    });
  });
});

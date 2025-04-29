import { ApolloServer } from 'apollo-server';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { schema } from '../graphql';
import { CategoryModel } from '../models/Category';

let server: ApolloServer;
let mongo: MongoMemoryServer;
const adminUserId = new Types.ObjectId();
let createdCategoryId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();

  server = new ApolloServer({
    schema,
    context: () => ({
      user: {
        id: adminUserId.toHexString(),
        email: 'admin@example.com',
        role: 'admin' // Important for category operations
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
  await CategoryModel.deleteMany();
});

describe('GraphQL Category Integration Tests', () => {
    beforeEach(async () => {
      await CategoryModel.deleteMany();
  
      const create = await server.executeOperation({
        query: `
          mutation {
            createCategory(name: "Test Category") {
              id
              name
              slug
            }
          }
        `
      });
      createdCategoryId = create.data?.createCategory.id;
    });
  
    it('should create a new category', async () => {
      expect(createdCategoryId).toBeDefined();
    });
  
    it('should fetch list of categories', async () => {
      const result = await server.executeOperation({
        query: `query { getCategories { id name } }`
      });
  
      expect(result.errors).toBeUndefined();
      expect(result.data?.getCategories.length).toBeGreaterThan(0);
    });
  
    it('should update a category', async () => {
      const result = await server.executeOperation({
        query: `
          mutation {
            updateCategory(id: "${createdCategoryId}", name: "Updated Name") {
              id
              name
              slug
            }
          }
        `
      });
  
      expect(result.errors).toBeUndefined();
      expect(result.data?.updateCategory.name).toBe('Updated Name');
      expect(result.data?.updateCategory.slug).toBe('updated-name');
    });
  
    it('should soft delete a category', async () => {
      const result = await server.executeOperation({
        query: `
          mutation {
            deleteCategory(id: "${createdCategoryId}")
          }
        `
      });
  
      expect(result.errors).toBeUndefined();
      expect(result.data?.deleteCategory).toBe(true);
    });
  
    it('should not allow non-admin to create category', async () => {
      const nonAdminServer = new ApolloServer({
        schema,
        context: () => ({ user: { id: 'u123', email: 'u@test.com', role: 'user' } })
      });
  
      const result = await nonAdminServer.executeOperation({
        query: `mutation { createCategory(name: "NoPermission") { id } }`
      });
  
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toMatch(/Only admins can create categories/);
    });
  
    it('should return error for invalid category ID in update', async () => {
      const result = await server.executeOperation({
        query: `mutation { updateCategory(id: "invalid-id", name: "Anything") { id } }`
      });
  
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toMatch(/Invalid category ID/);
    });
  
    it('should return error for empty name on create', async () => {
      const result = await server.executeOperation({
        query: `mutation { createCategory(name: "") { id } }`
      });
  
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toMatch(/Category name cannot be empty/);
    });
  });
  

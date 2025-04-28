// tests/review.graphql.test.ts
import { ApolloServer } from 'apollo-server';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { schema } from '../graphql';
import { ProductModel } from '../models/Product';
import { ReviewModel } from '../models/Review';
import { Types } from 'mongoose';

let server: ApolloServer;
let mongo: MongoMemoryServer;
let testUserId = new Types.ObjectId();
let productId: string;
let reviewId: string;

jest.setTimeout(20000);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();

  server = new ApolloServer({
    schema,
    context: () => ({
      user: {
        id: testUserId.toHexString(),
        email: 'testuser@example.com',
        role: 'user'
      }
    })
  });

  const product = await ProductModel.create({
    name: 'Test Product',
    description: 'For review testing',
    price: 50,
    stock: 20,
    category: 'Test'
  });

  productId = product._id?.toString() || '';
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    if (mongo) await mongo.stop();
});

afterEach(async () => {
  await ReviewModel.deleteMany({});
});

describe('GraphQL Review Integration Tests', () => {
  it('should add a review', async () => {
    const result = await server.executeOperation({
      query: `
        mutation {
          addReview(productId: "${productId}", rating: 5, comment: "Excellent product!") {
            id
            rating
            comment
          }
        }
      `
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.addReview.rating).toBe(5);
    expect(result.data?.addReview.comment).toBe('Excellent product!');
    reviewId = result.data?.addReview.id;
  });

  it('should fetch reviews for a product', async () => {
    await ReviewModel.create({
      productId,
      userId: testUserId,
      rating: 4,
      comment: 'Good',
    });

    const result = await server.executeOperation({
      query: `
        query {
          getProductReviews(productId: "${productId}") {
            id
            rating
            comment
          }
        }
      `
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.getProductReviews.length).toBeGreaterThan(0);
  });

  it('should update a review', async () => {
    const review = await ReviewModel.create({
      productId,
      userId: testUserId,
      rating: 3,
      comment: 'Average'
    });

    const result = await server.executeOperation({
      query: `
        mutation {
          updateReview(id: "${review.id}", rating: 4, comment: "Better now") {
            id
            rating
            comment
          }
        }
      `
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.updateReview.rating).toBe(4);
    expect(result.data?.updateReview.comment).toBe('Better now');
  });

  it('should delete a review', async () => {
    const review = await ReviewModel.create({
      productId,
      userId: testUserId,
      rating: 2,
      comment: 'Bad'
    });

    const result = await server.executeOperation({
      query: `
        mutation {
          deleteReview(id: "${review.id}")
        }
      `
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.deleteReview).toBe(true);
  });

  it('should throw error for invalid product ID in addReview', async () => {
    const result = await server.executeOperation({
      query: `
        mutation {
          addReview(productId: "invalid-id", rating: 5, comment: "Invalid!") {
            id
          }
        }
      `
    });

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0].message).toMatch(/Invalid product ID/);
  });
});

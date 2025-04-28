// tests/review.unit.test.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ReviewModel, IReview } from '../models/Review';
import { ProductModel } from '../models/Product';
import { isValidObjectId } from '../utils/validateObjectId';

describe('Review Module', () => {
  let mongo: MongoMemoryServer;
  let createdReview: IReview;
  let testProductId: string;
  const testUserId = new mongoose.Types.ObjectId();


  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();

    // Create a sample product
    const product = new ProductModel({
      name: 'Sample Product',
      description: 'Product for review testing',
      price: 100,
      stock: 10,
      category: 'Test'
    });
    await product.save();
    testProductId = product._id?.toString() || '';
  });


  beforeEach(async () => {
    await ReviewModel.deleteMany({});

    const review = new ReviewModel({
      productId: testProductId,
      userId: testUserId,
      rating: 4,
      comment: 'Good Product'
    });
    await review.save();
    createdReview = review;
  });

  it('should create a review', async () => {
    expect(createdReview.rating).toBe(4);
    expect(createdReview.comment).toBe('Good Product');
  });

  it('should fetch reviews by productId', async () => {
    const reviews = await ReviewModel.find({ productId: testProductId });
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].rating).toBe(4);
  });

  it('should update a review', async () => {
    const updated = await ReviewModel.findByIdAndUpdate(
      createdReview._id,
      { rating: 5, comment: 'Excellent!' },
      { new: true }
    );
    expect(updated?.rating).toBe(5);
    expect(updated?.comment).toBe('Excellent!');
  });

  it('should delete a review', async () => {
    const deleted = await ReviewModel.findByIdAndDelete(createdReview._id);
    expect(deleted).not.toBeNull();
  
    const reviewAfterDelete = await ReviewModel.findById(createdReview._id);
    expect(reviewAfterDelete).toBeNull();
  });
  

  it('should validate invalid ObjectId (short)', async () => {
    const isValid = isValidObjectId('123');
    expect(isValid).toBe(false);
  });

  it('should validate invalid ObjectId (null)', async () => {
    const isValid = isValidObjectId(null);
    expect(isValid).toBe(false);
  });

  it('should return null for unknown valid ObjectId', async () => {
    const unknownId = new mongoose.Types.ObjectId();
    const review = await ReviewModel.findById(unknownId);
    expect(review).toBeNull();
  });
});

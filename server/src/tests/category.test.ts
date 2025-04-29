// tests/category.unit.test.ts
import { CategoryModel } from '../models/Category';
import mongoose from 'mongoose';
import { isValidObjectId } from '../utils/validateObjectId';

describe('Category Module Unit Tests', () => {
  const adminUserId = new mongoose.Types.ObjectId();
  let createdCategoryId: string;

  beforeEach(async () => {
    await CategoryModel.deleteMany({});

    const category = new CategoryModel({
      name: 'Test Category',
      slug: 'test-category'
    });
    await category.save();
    createdCategoryId = category.id;
  });

  it('should create a category', async () => {
    const category = new CategoryModel({
      name: 'New Category',
      slug: 'new-category'
    });
    await category.save();

    expect(category.name).toBe('New Category');
    expect(category.slug).toBe('new-category');
  });

  it('should fetch categories', async () => {
    const categories = await CategoryModel.find({ isActive: true });
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].name).toBe('Test Category');
  });

  it('should update a category name and slug', async () => {
    const updated = await CategoryModel.findByIdAndUpdate(
      createdCategoryId,
      { name: 'Updated Category', slug: 'updated-category' },
      { new: true }
    );

    expect(updated?.name).toBe('Updated Category');
    expect(updated?.slug).toBe('updated-category');
  });

  it('should soft delete a category', async () => {
    const deleted = await CategoryModel.findByIdAndUpdate(
      createdCategoryId,
      { isActive: false },
      { new: true }
    );

    expect(deleted?.isActive).toBe(false);
  });

  it('should not find category with wrong ID', async () => {
    const result = await CategoryModel.findById(new mongoose.Types.ObjectId());
    expect(result).toBeNull();
  });

  it('should validate invalid ObjectId (short)', () => {
    const isValid = isValidObjectId('123');
    expect(isValid).toBe(false);
  });

  it('should validate invalid ObjectId (null)', () => {
    const isValid = isValidObjectId(null);
    expect(isValid).toBe(false);
  });
});

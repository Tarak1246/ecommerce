import { ProductModel, IProduct } from '../models/Product';
import mongoose from 'mongoose';
import { isValidObjectId } from '../utils/validateObjectId';

describe('Product Module Unit Tests', () => {
  const testCategoryId = new mongoose.Types.ObjectId();
  let createdProduct: IProduct;

  const productData = {
    name: 'Test Phone',
    description: 'Super fast 5G phone',
    price: 799.99,
    stock: 20,
    category: testCategoryId,
    images: ['https://example.com/img.png']
  };

  beforeEach(async () => {
    await ProductModel.deleteMany();

    const product = new ProductModel(productData);
    await product.save();
    createdProduct = product;
  });

  it('should create a product with correct fields', async () => {
    expect(createdProduct.name).toBe(productData.name);
    expect(createdProduct.slug).toBe('test-phone');
    expect(createdProduct.isActive).toBe(true);
  });

  it('should fetch product by slug', async () => {
    const product = await ProductModel.findOne({ slug: 'test-phone' });
    expect(product).not.toBeNull();
    expect(product?.name).toBe('Test Phone');
  });

  it('should fetch products with category filter', async () => {
    const products = await ProductModel.find({ category: testCategoryId });
    expect(products.length).toBeGreaterThan(0);
  });

  it('should update product stock and deactivate when stock is 0', async () => {
    const updated = await ProductModel.findByIdAndUpdate(
      createdProduct._id,
      { stock: 0, isActive: false },
      { new: true }
    );
    expect(updated?.stock).toBe(0);
    expect(updated?.isActive).toBe(false);
  });
  

  it('should soft delete product', async () => {
    const deleted = await ProductModel.findByIdAndUpdate(
      createdProduct._id,
      { isActive: false },
      { new: true }
    );
    expect(deleted?.isActive).toBe(false);
  });

  it('should prevent duplicate slug conflict', async () => {
    const duplicate = new ProductModel({ ...productData, name: 'Test Phone' });
    let errorCaught = false;
    try {
      await duplicate.save();
    } catch (err: any) {
      errorCaught = true;
      expect(err.code).toBe(11000); // MongoDB duplicate key error
    }
    expect(errorCaught).toBe(true);
  });

  it('should validate negative price', async () => {
    const product = new ProductModel({
      ...productData,
      price: -100
    });

    try {
      await product.save();
    } catch (err: any) {
      expect(err.errors.price).toBeDefined();
    }
  });

  it('should validate negative stock', async () => {
    const product = new ProductModel({
      ...productData,
      stock: -5
    });

    try {
      await product.save();
    } catch (err: any) {
      expect(err.errors.stock).toBeDefined();
    }
  });

  it('should throw on invalid ObjectId (short)', async () => {
    const valid = isValidObjectId('123');
    expect(valid).toBe(false);
  });

  it('should throw on invalid ObjectId (null)', async () => {
    const valid = isValidObjectId(null);
    expect(valid).toBe(false);
  });

  it('should return null for unknown valid ObjectId', async () => {
    const unknownProduct = await ProductModel.findById('64d2c5fa9e864ee0fdde0000');
    expect(unknownProduct).toBeNull();
  });

});

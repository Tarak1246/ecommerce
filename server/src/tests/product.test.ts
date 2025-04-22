import { ProductModel, IProduct } from '../models/Product';
import { isValidObjectId } from '../utils/validateObjectId';

describe('Product Module', () => {
  const productData = {
    name: 'Test Phone',
    description: 'Super fast 5G phone',
    price: 799.99,
    stock: 20,
    category: 'Electronics',
    images: ['https://example.com/img.png']
  };

  let createdProduct: IProduct;

  beforeEach(async () => {
    const product = new ProductModel(productData);
    await product.save();
    createdProduct = product;
  });

  it('should create a product', async () => {
    expect(createdProduct.name).toBe(productData.name);
    expect(createdProduct.slug).toBe('test-phone');
  });

  it('should fetch product by slug', async () => {
    const product = await ProductModel.findOne({ slug: 'test-phone' });
    expect(product).not.toBeNull();
    expect(product?.name).toBe('Test Phone');
  });

  it('should fetch product list with filters', async () => {
    const products = await ProductModel.find({
      category: 'Electronics',
      isActive: true
    });
    expect(products.length).toBeGreaterThan(0);
  });

  it('should update product', async () => {
    const updated = await ProductModel.findByIdAndUpdate(createdProduct._id, { stock: 50 }, { new: true });
    expect(updated?.stock).toBe(50);
  });

  it('should soft delete product', async () => {
    const deleted = await ProductModel.findByIdAndUpdate(createdProduct._id, { isActive: false }, { new: true });
    expect(deleted?.isActive).toBe(false);
  });

  it('should throw on invalid id (short)', async () => {
    const isValid = isValidObjectId('123');
    expect(isValid).toBe(false);
  });

  it('should throw on invalid id (null)', async () => {
    const isValid = isValidObjectId(null);
    expect(isValid).toBe(false);
  });

  it('should return null for unknown valid ObjectId', async () => {
    const product = await ProductModel.findById('64d2c5fa9e864ee0fdde0000');
    expect(product).toBeNull();
  });
});

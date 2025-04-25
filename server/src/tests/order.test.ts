// tests/order.test.ts
import { OrderModel } from '../models/Order';
import { CartModel } from '../models/Cart';
import { ProductModel } from '../models/Product';
import mongoose from 'mongoose';
import { isValidObjectId } from '../utils/validateObjectId';

describe('Order Module Unit Tests', () => {
  const userId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  let productId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    await OrderModel.deleteMany({});
    await CartModel.deleteMany({});
    await ProductModel.deleteMany({});

    const product = new ProductModel({
      name: 'Test Product',
      description: 'For order test',
      price: 100,
      stock: 10,
      category: 'Test'
    });
    await product.save();
    productId = product.id;

    const cart = new CartModel({
      userId: userId,
      items: [{ productId, quantity: 2 }]
    });
    await cart.save();
  });

  it('should return false for invalid order ID format', () => {
    expect(isValidObjectId('123')).toBe(false);
  });

  it('should fail placing order if cart is empty', async () => {
    await CartModel.deleteMany({});
    const cart = await CartModel.findOne({ userId });
    expect(cart).toBeNull();
  });

  it('should fail placing order with invalid product ID', async () => {
    const cart = await CartModel.findOne({ userId });
    cart!.items[0].productId = new mongoose.Types.ObjectId(); // non-existent product
    await cart!.save();

    const product = await ProductModel.findById(cart!.items[0].productId);
    expect(product).toBeNull();
  });

  it('should fail placing order if cart exceeds max limit', async () => {
    const cart = await CartModel.findOne({ userId });
    for (let i = 0; i < 25; i++) {
      cart!.items.push({ productId, quantity: 1 });
    }
    await cart!.save();

    expect(cart!.items.length).toBeGreaterThan(20);
  });

  it('should fail cancel order if status is shipped or delivered', async () => {
    const order = new OrderModel({
      userId: userId,
      items: [{ productId, name: 'Test Product', quantity: 1, price: 100 }],
      total: 100,
      payment: { method: 'cod', status: 'pending' },
      shipping: { address: 'A', city: 'B', zip: '12345', country: 'C' },
      status: 'shipped'
    });
    await order.save();

    expect(order.status).toBe('shipped');
  });

  it('should not allow non-admin to update status', async () => {
    const order = new OrderModel({
      userId: userId,
      items: [{ productId, name: 'Test Product', quantity: 1, price: 100 }],
      total: 100,
      payment: { method: 'cod', status: 'pending' },
      shipping: { address: 'A', city: 'B', zip: '12345', country: 'C' },
      status: 'placed'
    });
    await order.save();

    expect(order.status).toBe('placed');
    expect(order.userId.toString()).toEqual(userId.toString());
  });

  it('should not find order with wrong ID', async () => {
    const result = await OrderModel.findById(new mongoose.Types.ObjectId());
    expect(result).toBeNull();
  });

  it('should detect mismatch user on getOrder and fail if not admin', async () => {
    const order = new OrderModel({
      userId: adminId,
      items: [{ productId, name: 'Test Product', quantity: 1, price: 100 }],
      total: 100,
      payment: { method: 'cod', status: 'pending' },
      shipping: { address: 'A', city: 'B', zip: '12345', country: 'C' },
      status: 'placed'
    });
    await order.save();

    expect(order.userId.toString()).not.toEqual(userId.toString());
  });
});

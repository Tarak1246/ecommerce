// tests/cart.unit.test.ts
import { CartModel } from '../models/Cart';
import { ProductModel } from '../models/Product';
import mongoose from 'mongoose';
import { isValidObjectId } from '../utils/validateObjectId';

describe('Cart Module - Unit Tests', () => {
  const userId = new mongoose.Types.ObjectId();
  const productId = new mongoose.Types.ObjectId();

  let cart: any;

  beforeEach(async () => {
    cart = new CartModel({
      userId,
      items: [{ productId, quantity: 1 }]
    });
    await cart.save();
  });

  afterEach(async () => {
    await CartModel.deleteMany({});
  });

  it('should create cart with new item', async () => {
    const newCart = new CartModel({ userId: new mongoose.Types.ObjectId(), items: [] });
    await newCart.save();
    expect(newCart.items.length).toBe(0);
  });

  it('should find cart by userId', async () => {
    const found = await CartModel.findOne({ userId });
    expect(found).not.toBeNull();
    expect(found?.items.length).toBe(1);
  });

  it('should increase quantity if product exists in cart', async () => {
    const found = await CartModel.findOne({ userId });
    const item = found?.items.find(i => i.productId.toString() === productId.toString());
    if (item) item.quantity += 1;
    await found?.save();
    const updated = await CartModel.findOne({ userId });
    expect(updated?.items[0].quantity).toBe(2);
  });

  it('should update product quantity', async () => {
    const updated = await CartModel.findOne({ userId });
    const item = updated?.items.find(i => i.productId.toString() === productId.toString());
    if (item) item.quantity = 5;
    await updated?.save();
    const final = await CartModel.findOne({ userId });
    expect(final?.items[0].quantity).toBe(5);
  });

  it('should remove product from cart', async () => {
    const found = await CartModel.findOne({ userId });
    if (found) {
      found.items = found.items.filter(i => i.productId.toString() !== productId.toString());
      await found.save();
    }
    const result = await CartModel.findOne({ userId });
    expect(result?.items.length).toBe(0);
  });

  it('should clear cart', async () => {
    const cart = await CartModel.findOne({ userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    const cleared = await CartModel.findOne({ userId });
    expect(cleared?.items.length).toBe(0);
  });

  it('should return false on invalid id (short)', () => {
    const isValid = isValidObjectId('123');
    expect(isValid).toBe(false);
  });

  it('should return false on invalid id (null)', () => {
    const isValid = isValidObjectId(null);
    expect(isValid).toBe(false);
  });

  it('should return null for unknown valid ObjectId', async () => {
    const unknown = await ProductModel.findById('64d2c5fa9e864ee0fdde0000');
    expect(unknown).toBeNull();
  });
});

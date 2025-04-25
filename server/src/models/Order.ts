import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: {
    productId: Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  status: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment: {
    method: 'card' | 'paypal' | 'cod';
    status: 'pending' | 'paid' | 'failed';
    transactionId?: string;
  };
  shipping: {
    address: string;
    city: string;
    zip: string;
    country: string;
  };
  placedAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  items: [{
    productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'placed'
  },
  payment: {
    method: { type: String, enum: ['card', 'paypal', 'cod'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    transactionId: { type: String }
  },
  shipping: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true }
  }
}, { timestamps: { createdAt: 'placedAt', updatedAt: 'updatedAt' } });

export const OrderModel = mongoose.model<IOrder>('Order', orderSchema);

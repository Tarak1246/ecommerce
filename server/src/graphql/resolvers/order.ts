import { OrderModel } from '../../models/Order';
import { CartModel } from '../../models/Cart';
import { IContext } from '../../types/context';
import { isValidObjectId } from '../../utils/validateObjectId';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/error';
import { ProductModel } from '../../models/Product';
import { placeOrderSchema, updateOrderStatusSchema } from '../../validators/order';

const MAX_CART_ITEMS = 20;

export const orderResolvers = {
  Query: {
    getOrders: async (_: any, __: any, context: IContext) => {
      if (!context.user) throw new BadRequestError('Not authenticated');
      return await OrderModel.find({ userId: context.user.id }).sort({ placedAt: -1 });
    },

    getOrder: async (_: any, { id }: { id: string }, context: IContext) => {
      if (!context.user) throw new BadRequestError('Not authenticated');
      if (!isValidObjectId(id)) throw new BadRequestError('Invalid order ID');

      const order = await OrderModel.findById(id);
      if (!order) throw new NotFoundError('Order not found');
      if (order.userId.toString() !== context.user.id && context.user.role !== 'admin') {
        throw new UnauthorizedError('You are not authorized to access this order');
      }
      return order;
    }
  },

  Mutation: {

    placeOrder: async (_: any, { input }: any, context: IContext) => {
      if (!context.user) throw new BadRequestError('Not authenticated');

      const { error } = placeOrderSchema.validate(input);
      if (error) throw new BadRequestError(error.details[0].message);

      const { itemProductIds, paymentMethod, shipping } = input;

      const cart = await CartModel.findOne({ userId: context.user.id });
      if (!cart || cart.items.length === 0) {
        throw new BadRequestError('Cart is empty');
      }

      if (cart.items.length > MAX_CART_ITEMS) {
        throw new BadRequestError('Exceeded maximum cart items');
      }
      // Filter cart items based on itemProductIds if provided
      const selectedItems = itemProductIds?.length
        ? cart.items.filter(item => itemProductIds.includes(item.productId.toString()))
        : cart.items;

      if (selectedItems.length === 0) {
        throw new BadRequestError('Selected items not found in cart');
      }

      const items = [];
      let total = 0;

      for (const item of selectedItems) {
        const product = await ProductModel.findById(item.productId);
        if (!product) throw new NotFoundError(`Product ${item.productId} not found`);

        items.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity
        });

        total += product.price * item.quantity;
      }

      const transactionId = input.paymentMethod !== 'cod'
        ? `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        : undefined;

      //Save new order
      const order = await OrderModel.create({
        userId: context.user.id,
        items,
        total,
        payment: {
          method: paymentMethod,
          status: paymentMethod === 'cod' ? 'pending' : 'paid',
          transactionId
        },
        shipping,
        status: 'placed'
      });

      //Remove ordered items from cart
      cart.items = cart.items.filter(
        item => !selectedItems.some(si => si.productId.toString() === item.productId.toString())
      );
      await cart.save();

      return order;
    },
    updateOrderStatus: async (_: any, { id, status }: { id: string, status: string }, context: IContext) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new UnauthorizedError('Only admin can update order status');
      }

      const { error } = updateOrderStatusSchema.validate({ id, status });
      if (error) throw new BadRequestError(error.details[0].message);

      if (!isValidObjectId(id)) throw new BadRequestError('Invalid order ID');

      const order = await OrderModel.findById(id);
      if (!order) throw new NotFoundError('Order not found');

      const validStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
      if (!validStatuses.includes(status as any)) {
        throw new BadRequestError('Invalid order status');
      }
      order.status = status as typeof validStatuses[number];
      await order.save();
      return order;
    },

    cancelOrder: async (_: any, { id }: { id: string }, context: IContext) => {
      if (!context.user) throw new BadRequestError('Not authenticated');
      if (!isValidObjectId(id)) throw new BadRequestError('Invalid order ID');

      const order = await OrderModel.findById(id);
      if (!order) throw new NotFoundError('Order not found');

      if (order.userId.toString() !== context.user.id) {
        throw new UnauthorizedError('You are not authorized to cancel this order');
      }

      if (['shipped', 'delivered'].includes(order.status)) {
        throw new BadRequestError('Cannot cancel an order that is already shipped or delivered');
      }

      order.status = 'cancelled';
      await order.save();
      return true;
    }
  }
};

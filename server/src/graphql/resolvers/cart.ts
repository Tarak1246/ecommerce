import { CartModel } from '../../models/Cart';
import { IContext } from '../../types/context';
import { BadRequestError, NotFoundError } from '../../utils/error';
import mongoose from 'mongoose';
import { isValidObjectId } from '../../utils/validateObjectId';
import { ProductModel } from '../../models/Product';

export const cartResolvers = {
    Query: {
        getCart: async (_: any, __: any, context: IContext) => {
            if (!context.user) throw new BadRequestError('Not authenticated');
            let cart = await CartModel.findOne({ userId: context.user.id });
            if (!cart) {
                cart = await CartModel.create({ userId: context.user.id, items: [] });
            }
            return cart;
        }
    },

    Mutation: {
        addToCart: async (_: any, { productId }: { productId: string }, context: IContext) => {
            if (!context.user) throw new BadRequestError('Not authenticated');

            if (!isValidObjectId(productId)) {
                throw new BadRequestError('Invalid product ID');
            }

            const product = await ProductModel.findById(productId).lean();
            if (!product) throw new NotFoundError('Product not found');

            let cart = await CartModel.findOne({ userId: context.user.id });
            if (!cart) {
                cart = new CartModel({ userId: context.user.id, items: [] });
            }

            const existingItem = cart.items.find((item) =>
                item.productId.toString() === productId
            );

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.items.push({ productId: new mongoose.Types.ObjectId(productId), quantity: 1 });
            }

            await cart.save();
            return cart;
        },

        updateCartItem: async (_: any, { productId, quantity }: { productId: string, quantity: number }, context: IContext) => {
            if (!context.user) throw new BadRequestError('Not authenticated');

            if (!isValidObjectId(productId)) {
                throw new BadRequestError('Invalid product ID');
            }

            if (typeof quantity !== 'number' || quantity < 1) {
                throw new BadRequestError('Quantity must be a positive number');
            }

            const cart = await CartModel.findOne({ userId: context.user.id });
            if (!cart) throw new NotFoundError('Cart not found');

            const item = cart.items.find(item => item.productId.toString() === productId);
            if (!item) throw new NotFoundError('Product not found in cart');

            item.quantity = quantity;
            await cart.save();
            return cart;
        },

        removeFromCart: async (_: any, { productId }: { productId: string }, context: IContext) => {
            if (!context.user) throw new BadRequestError('Not authenticated');

            if (!isValidObjectId(productId)) {
                throw new BadRequestError('Invalid product ID');
            }

            const cart = await CartModel.findOne({ userId: context.user.id });
            if (!cart) throw new NotFoundError('Cart not found');

            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex === -1) throw new NotFoundError('Product not found in cart');

            cart.items.splice(itemIndex, 1);
            await cart.save();
            return cart;
        },

        clearCart: async (_: any, __: any, context: IContext) => {
            if (!context.user) throw new BadRequestError('Not authenticated');

            const cart = await CartModel.findOne({ userId: context.user.id });
            if (!cart) return false;

            cart.items = [];
            await cart.save();
            return true;
        }
    }
};

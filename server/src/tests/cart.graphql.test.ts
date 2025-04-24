import { ApolloServer } from 'apollo-server';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { schema } from '../graphql';
import { CartModel } from '../models/Cart';
import { ProductModel } from '../models/Product';

const testUserId = new Types.ObjectId();
let server: ApolloServer;
let mongo: MongoMemoryServer;
let productId: string;

jest.setTimeout(20000);

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();

    server = new ApolloServer({
        schema,
        context: () => ({
            user: {
                id: testUserId.toHexString(),
                email: 'user@example.com',
                role: 'user'
            }
        })
    });
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    if (mongo) await mongo.stop();
});

afterEach(async () => {
    await CartModel.deleteMany({});
    await ProductModel.deleteMany({}); // Clean up overflow test products
});

describe('GraphQL Cart Integration Tests', () => {
    beforeEach(async () => {
        const product = await ProductModel.create({
            name: 'GraphQL Product',
            description: 'Testing cart flow',
            price: 100,
            stock: 50,
            category: 'Test'
        });
        console.log('Product created:', product);
        productId = product?.id?.toString() || '';
        console.log('Product ID:', productId);
        await CartModel.deleteMany({});
        await server.executeOperation({
            query: `mutation { addToCart(productId: "${productId}") { id } }`
        });
    });

    it('should add a product to cart', async () => {
        const result = await server.executeOperation({
            query: `mutation { addToCart(productId: "${productId}") { id items { productId quantity } } }`
        });
        expect(result.errors).toBeUndefined();
        expect(result.data?.addToCart.items.length).toBe(1);
    });

    it('should update item quantity', async () => {
        const result = await server.executeOperation({
            query: `mutation { updateCartItem(productId: "${productId}", quantity: 4) { id items { productId quantity } } }`
        });
        expect(result.errors).toBeUndefined();
        expect(result.data?.updateCartItem.items[0].quantity).toBe(4);
    });

    it('should remove item from cart', async () => {
        const result = await server.executeOperation({
            query: `mutation { removeFromCart(productId: "${productId}") { items { productId quantity } } }`
        });
        expect(result.errors).toBeUndefined();
        expect(result.data?.removeFromCart.items.length).toBe(0);
    });

    it('should clear the cart', async () => {
        const result = await server.executeOperation({ query: `mutation { clearCart }` });
        expect(result.errors).toBeUndefined();
        expect(result.data?.clearCart).toBe(true);
    });

    it('should return error for invalid product ID in addToCart', async () => {
        const result = await server.executeOperation({
            query: `mutation { addToCart(productId: "123") { id } }`
        });
        expect(result.errors).toBeDefined();
        expect(result.errors?.[0].message).toMatch(/Invalid product ID/i);
    });

    it('should return error for unauthorized access', async () => {
        const unauthorizedServer = new ApolloServer({
            schema,
            context: () => ({ user: null })
        });

        const result = await unauthorizedServer.executeOperation({
            query: `mutation { clearCart }`
        });

        expect(result.errors).toBeDefined();
        expect(result.errors?.[0].message).toMatch(/Not authenticated/i);
    });
});
